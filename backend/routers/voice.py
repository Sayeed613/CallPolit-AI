import json
import logging
from fastapi import APIRouter, Request, Query
from fastapi.responses import Response, PlainTextResponse
from datetime import datetime
from typing import Optional

from services.supabase_client import supabase, increment_campaign_counter, check_campaign_completion
from services.gemini_service import generate_response, generate_transcript_summary
from services.rag_service import retrieve_relevant_chunks, build_context, detect_escalation, detect_sentiment
from services.twilio_service import build_voice_twiml, build_gather_twiml, end_call_twiml
from services.verification_service import generate_otp
from services.redis_client import get_call_state, set_call_state, delete_call_state
from routers.live import broadcast_event

logger = logging.getLogger(__name__)

router = APIRouter()

VERIFICATION_OTPS: dict[str, str] = {}


async def _get_or_create_state(call_sid: str, company_id: str = "", campaign_id: str = "", contact_id: str = "", contact_name: str = "") -> dict:
    state = await get_call_state(call_sid)
    if not state:
        state = {
            "company_id": company_id,
            "campaign_id": campaign_id,
            "contact_id": contact_id,
            "contact_name": contact_name,
            "turn_count": 0,
            "transcript": [],
            "sentiment_history": [],
            "verified": False,
            "verification_step": 0,
            "conversation_ended": False,
        }
        await set_call_state(call_sid, state)
    return state


@router.post("/outbound-call")
async def outbound_call_webhook(
    request: Request,
    company_id: str = Query(""),
    campaign_id: str = Query(""),
    contact_id: str = Query(""),
    contact_name: str = Query(""),
):
    """Twilio webhook for initializing an outbound call."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")

    state = await _get_or_create_state(call_sid, company_id, campaign_id, contact_id, contact_name)

    # Get company info
    company = supabase.table("companies").select("*").eq("id", company_id).single().execute()
    company_name = company.data.get("name", "Business") if company.data else "Business"
    industry = company.data.get("industry", "service") if company.data else "service"
    language = company.data.get("language_preference", ["hindi"])[0] if company.data else "hindi"

    # Get customer info
    customer = supabase.table("customers").select("*").eq("id", contact_id).single().execute()
    contact_language = customer.data.get("language", "hindi") if customer.data else "hindi"
    state["contact_language"] = contact_language

    # Get RAG context
    chunks = retrieve_relevant_chunks(company_id, "introduction and purpose")
    context = build_context(chunks)

    # Build system prompt
    system_prompt = (
        f"You are a professional AI calling agent for {company_name}, a {industry} company. "
        f"Your name is 'CallPilot Assistant'. Answer ONLY from the company documents provided. "
        f"Speak in the customer's language. Be polite, professional, and concise. "
        f"Do NOT make up information not in the documents. "
        f"If you cannot find the answer in the documents, politely say you don't have that information. "
        f"Keep responses under 30 words. Ask one question at a time.\n\n"
        f"Company Context:\n{context}\n\n"
        f"Contact name: {contact_name}"
    )
    state["system_prompt"] = system_prompt

    # Generate initial greeting
    greeting_prompt = f"Generate a brief greeting and introduction for calling {contact_name}. Ask how they are doing."
    greeting = generate_response(system_prompt, greeting_prompt)
    if not greeting:
        greeting = f"Hello {contact_name}, this is a call from {company_name}. How are you today?"

    # Determine language for TTS
    tts_language = "hi" if contact_language in ["hindi", "hi"] else "en"

    twiml = build_voice_twiml(greeting, tts_language, company_name)

    # Update call log
    supabase.table("call_logs").update({
        "status": "in-progress",
        "started_at": datetime.utcnow().isoformat(),
    }).eq("twilio_call_sid", call_sid).execute()

    state["transcript"].append({"role": "assistant", "content": greeting})
    await set_call_state(call_sid, state)

    # Broadcast call_state event
    try:
        await broadcast_event("call_state", {
            "call_sid": call_sid,
            "campaign_id": campaign_id,
            "company_id": company_id,
            "contact_id": contact_id,
            "contact_name": contact_name,
            "contact_phone": customer.data.get("phone", "") if customer.data else "",
            "status": "in-progress",
            "direction": "outbound",
        })
    except Exception:
        pass

    return PlainTextResponse(str(twiml), media_type="text/xml")


@router.post("/gather")
async def gather_webhook(request: Request):
    """Twilio webhook for processing gathered speech input."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    speech_result = form_data.get("SpeechResult", "")

    state = await get_call_state(call_sid)
    if not state:
        return PlainTextResponse(str(end_call_twiml()), media_type="text/xml")

    if state.get("conversation_ended"):
        return PlainTextResponse(str(end_call_twiml("Thank you for your time. Goodbye!")), media_type="text/xml")

    # Add to transcript
    state["transcript"].append({"role": "user", "content": speech_result})
    state["turn_count"] += 1

    # Detect sentiment
    sentiment = detect_sentiment(speech_result)
    state["sentiment_history"].append(sentiment)

    # Broadcast transcript event
    try:
        await broadcast_event("transcript", {
            "call_sid": call_sid,
            "campaign_id": state.get("campaign_id", ""),
            "company_id": state.get("company_id", ""),
            "contact_id": state.get("contact_id", ""),
            "contact_name": state.get("contact_name", ""),
            "role": "customer",
            "text": speech_result,
            "turn_count": state["turn_count"],
            "sentiment_score": sentiment,
        })
    except Exception:
        pass

    # Check for escalation
    if detect_escalation(speech_result):
        state["conversation_ended"] = True
        update_call_log(call_sid, state)
        await set_call_state(call_sid, state)
        twiml = end_call_twiml(
            "I'm connecting you to a human agent. Please hold. Thank you.",
            state.get("contact_language", "en"),
        )
        return PlainTextResponse(str(twiml), media_type="text/xml")

    # Build context for AI response
    context = {"company_name": "", "industry": ""}
    if state.get("company_id"):
        company = supabase.table("companies").select("name,industry").eq("id", state["company_id"]).single().execute()
        if company.data:
            context = company.data

    system_prompt = state.get("system_prompt", "You are a professional AI calling agent.")

    # Generate AI response
    transcript_text = "\n".join(
        [f"{'AI' if t['role'] == 'assistant' else 'Customer'}: {t['content']}"
         for t in state["transcript"][-5:]]  # Last 5 exchanges for context
    )

    user_prompt = f"Conversation so far:\n{transcript_text}\n\nRespond to the customer's last message."
    ai_response = generate_response(system_prompt, user_prompt)
    if not ai_response:
        ai_response = "Thank you for sharing that information. Is there anything else you would like to discuss?"

    state["transcript"].append({"role": "assistant", "content": ai_response})

    # Broadcast transcript event
    try:
        await broadcast_event("transcript", {
            "call_sid": call_sid,
            "campaign_id": state.get("campaign_id", ""),
            "company_id": state.get("company_id", ""),
            "contact_id": state.get("contact_id", ""),
            "contact_name": state.get("contact_name", ""),
            "role": "ai",
            "text": ai_response,
            "turn_count": state["turn_count"],
            "sentiment_score": sum(state["sentiment_history"]) / len(state["sentiment_history"]) if state["sentiment_history"] else 0.5,
        })
    except Exception:
        pass

    # Check if call should end
    if state["turn_count"] >= 20:
        state["conversation_ended"] = True
        update_call_log(call_sid, state)
        await set_call_state(call_sid, state)
        twiml = end_call_twiml(
            "Thank you for your time. We will follow up if needed. Goodbye!",
            state.get("contact_language", "en"),
        )
        return PlainTextResponse(str(twiml), media_type="text/xml")

    tts_language = state.get("contact_language", "en")
    twiml = build_gather_twiml(ai_response, tts_language)
    await set_call_state(call_sid, state)
    return PlainTextResponse(str(twiml), media_type="text/xml")


@router.post("/call-status")
async def call_status_webhook(request: Request):
    """Twilio webhook for call status updates."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    call_status = form_data.get("CallStatus", "")
    call_duration = float(form_data.get("CallDuration", 0))

    company_id = form_data.get("company_id", "")
    campaign_id = form_data.get("campaign_id", "")
    contact_id = form_data.get("contact_id", "")

    # Update call log
    update_data = {
        "status": call_status,
    }
    if call_duration > 0:
        update_data["duration"] = call_duration
    if call_status in ["completed", "no-answer", "busy", "failed"]:
        update_data["ended_at"] = datetime.utcnow().isoformat()

    supabase.table("call_logs").update(update_data).eq("twilio_call_sid", call_sid).execute()

    # Save transcript and generate summary if completed
    if call_status == "completed" and call_duration > 5:
        state = await get_call_state(call_sid)
        if state and state.get("transcript"):
            # Save transcript
            supabase.table("call_logs").update({
                "transcript": json.dumps(state["transcript"]),
                "sentiment_score": sum(state["sentiment_history"]) / len(state["sentiment_history"]) if state["sentiment_history"] else 0.5,
            }).eq("twilio_call_sid", call_sid).execute()

            # Generate summary
            summary = generate_transcript_summary(state["transcript"])
            if summary:
                supabase.table("call_logs").update({"notes": summary}).eq("twilio_call_sid", call_sid).execute()

        # Update last_called on customer
        if contact_id:
            supabase.table("customers").update({
                "last_called": datetime.utcnow().isoformat(),
                "verified": True,
            }).eq("id", contact_id).execute()

    # Update campaign counters
    MAX_RETRIES = 3

    if campaign_id:
        if call_status == "completed" and call_duration > 5:
            increment_campaign_counter(campaign_id, "connected")
        elif call_status in ["no-answer", "busy", "failed"]:
            log = supabase.table("call_logs").select("retry_count").eq("twilio_call_sid", call_sid).single().execute()
            retry_count = (log.data.get("retry_count", 0) if log.data else 0) + 1
            supabase.table("call_logs").update({"retry_count": retry_count}).eq("twilio_call_sid", call_sid).execute()

            if retry_count >= MAX_RETRIES:
                increment_campaign_counter(campaign_id, "unreachable")

        check_campaign_completion(campaign_id)

    # Broadcast final call_state
    try:
        await broadcast_event("call_state", {
            "call_sid": call_sid,
            "campaign_id": campaign_id or "",
            "company_id": company_id or "",
            "contact_id": contact_id or "",
            "contact_phone": "",
            "status": call_status,
            "duration": call_duration,
            "final": True,
        })
    except Exception:
        pass

    # Cleanup state
    await delete_call_state(call_sid)

    return {"success": True}


@router.post("/incoming-call")
async def incoming_call_webhook(request: Request):
    """Twilio webhook for incoming calls."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    from_number = form_data.get("From", "")
    to_number = form_data.get("To", "")

    # Find company by Twilio phone number
    company = supabase.table("companies").select("*").eq("twilio_phone_number", to_number).single().execute()
    if not company.data:
        twiml = end_call_twiml("Thank you for calling. Goodbye.")
        return PlainTextResponse(str(twiml), media_type="text/xml")

    company_id = company.data["id"]
    company_name = company.data["name"]
    industry = company.data["industry"]

    # Create call log
    supabase.table("call_logs").insert({
        "company_id": company_id,
        "contact_phone": from_number,
        "caller_phone": to_number,
        "status": "in-progress",
        "direction": "inbound",
        "started_at": datetime.utcnow().isoformat(),
    }).execute()

    # Get after-hours message
    after_hours = company.data.get("after_hours_message", "")

    # Generate greeting
    greeting = (
        f"Thank you for calling {company_name}. This is your AI assistant. "
        f"How can I help you today?"
    )

    state = await _get_or_create_state(call_sid, company_id)
    state["system_prompt"] = (
        f"You are a professional AI receptionist for {company_name}, a {industry} company. "
        f"Answer calls politely and help customers with their queries. "
        f"Keep responses concise and professional."
    )
    await set_call_state(call_sid, state)

    twiml = build_voice_twiml(greeting, "en", company_name)
    return PlainTextResponse(str(twiml), media_type="text/xml")


def update_call_log(call_sid: str, state: dict):
    """Update call log with transcript data."""
    try:
        transcript = state.get("transcript", [])
        sentiment_scores = state.get("sentiment_history", [])
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.5

        supabase.table("call_logs").update({
            "transcript": json.dumps(transcript),
            "sentiment_score": avg_sentiment,
        }).eq("twilio_call_sid", call_sid).execute()
    except Exception as e:
        logger.error(f"Error updating call log: {e}")
