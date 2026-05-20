from fastapi import APIRouter, Form, Query, HTTPException
from fastapi.responses import Response
import sys

from services.supabase_client import (
    supabase,
    get_company,
    get_company_by_phone,
    create_call_log,
    update_call_log,
    get_call_log_by_sid,
    match_chunks,
    update_contact_status,
    increment_campaign_called,
    increment_campaign_connected,
    get_campaign,
    update_campaign_status,
)
from services.groq_service import generate_response, get_embedding
from services.rag_service import build_rag_context, detect_escalation
from config.settings import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])


def _build_twiml(body: str) -> str:
    """Return a minimal TwiML response string."""
    return f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>'


def _lookup_company_by_phone(phone: str) -> tuple[str | None, str]:
    """Look up a company by their Twilio phone number.
    Returns (company_id, company_name).
    Falls back to client-side filtering if DB query fails.
    """
    try:
        # First try: direct DB lookup via twilio_phone column
        company = get_company_by_phone(phone)
        if company:
            return company["id"], company.get("name", "CallPilot AI")
    except Exception:
        pass

    # Second try: fetch all companies and filter in Python
    # (PostgREST schema cache may not support filtering by new column)
    try:
        all_companies = supabase.table("companies").select("*").execute()
        for c in all_companies.data:
            tp = c.get("twilio_phone", "")
            # Strip any non-digit chars for comparison
            if tp.replace("+", "").replace("-", "").replace(" ", "") == phone.replace("+", "").replace("-", "").replace(" ", ""):
                return c["id"], c.get("name", "CallPilot AI")
    except Exception:
        pass

    return None, "CallPilot AI"


@router.post("/inbound", response_class=Response)
async def inbound_call(
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    CallStatus: str = Form(default="ringing"),
    company_id: str | None = Query(default=None),
):
    """Twilio outbound call webhook (called when customer answers).

    Generates a greeting from the company's PDF context via Groq,
    passes company_id as a query param so handle-speech can use it for RAG.
    """
    # Store call log (no campaign/contact for inbound calls)
    try:
        call_log = create_call_log(None, None, CallSid, status=CallStatus)
    except Exception:
        pass

    # Resolve company_id (from query param or phone lookup)
    company_name = "CallPilot AI"
    if company_id:
        company = get_company(company_id)
        if company:
            company_name = company.get("name", "CallPilot AI")
    else:
        company_id, company_name = _lookup_company_by_phone(To)

    # Generate outbound greeting from PDF context
    greeting = None
    try:
        # Get top 2 document chunks for this company (generic query)
        generic_embedding = get_embedding("company information and services overview")
        if company_id:
            chunks = match_chunks(generic_embedding, company_id, match_count=2)
            context = build_rag_context(chunks) if chunks else "No information available."
        else:
            context = "No information available."

        # Generate opening line via Groq
        system_prompt = f"""You are an AI calling agent for {company_name}.
Generate a greeting for an outbound call (max 3 sentences).
The purpose of this call is defined by the company document below.
Sound professional and friendly. Speak in Hindi.
ONLY use information from the document. Do not add anything else.
End with a clear prompt inviting the customer to speak.

Company document context:
{context}"""
        greeting = generate_response(system_prompt, "Generate the opening greeting for this outbound call.", max_tokens=250)
    except Exception:
        pass

    # Fallback if greeting generation failed
    if not greeting:
        greeting = f"Namaste! Main {company_name} ki or se bol rahi hoon. Aapki kaise madad kar sakti hoon?"

    # Build Gather action URL with company_id as query param
    gather_url = f"{settings.PUBLIC_BASE_URL}/api/voice/handle-speech"
    if company_id:
        gather_url += f"?company_id={company_id}"

    # Use Twilio <Say> for TTS (Sarvam base64 <Play> does not work)
    twiml_body = (
        f'<Say language="hi-IN">{greeting}</Say>'
        f'<Gather input="speech" action="{gather_url}" '
        f'speechTimeout="auto" language="hi-IN" timeout="15">'
        f'</Gather>'
    )

    return Response(
        content=_build_twiml(twiml_body),
        media_type="application/xml",
    )


@router.post("/handle-speech", response_class=Response)
async def handle_speech(
    CallSid: str = Form(...),
    SpeechResult: str = Form(default=""),
    Confidence: float = Form(default=0.0),
    company_id: str | None = Query(default=None),
):
    """Handle customer speech input from Twilio Gather.

    Steps:
    1. Embed the speech result
    2. Search for relevant document chunks
    3. Build prompt with context
    4. Generate AI response via Groq
    5. Detect escalation triggers
    6. Return TwiML with response audio + next Gather
    """
    if not SpeechResult.strip():
        # No speech detected, prompt again
        gather_url = f"{settings.PUBLIC_BASE_URL}/api/voice/handle-speech"
        if company_id:
            gather_url += f"?company_id={company_id}"
        twiml_body = (
            '<Say language="hi-IN">Kya aap kuch poochhna chahenge?</Say>'
            f'<Gather input="speech" action="{gather_url}" '
            f'speechTimeout="auto" language="hi-IN" timeout="15">'
            f'</Gather>'
        )
        return Response(
            content=_build_twiml(twiml_body),
            media_type="application/xml",
        )

    # Look up the call log to get company_id
    call_log = get_call_log_by_sid(CallSid)
    resolved_company_id = company_id

    # Try to get company name
    company_name = "CallPilot AI"
    if resolved_company_id:
        company = get_company(resolved_company_id)
        if company:
            company_name = company.get("name", "CallPilot AI")

    # Update transcript in call_logs
    if call_log:
        existing = call_log.get("transcript") or ""
        updated_transcript = f"{existing}\nCustomer: {SpeechResult}"
        update_call_log(CallSid, {"transcript": updated_transcript})

    # Check for escalation
    if detect_escalation(SpeechResult):
        update_call_log(CallSid, {"outcome": "escalate"})
        return Response(
            content=_build_twiml(
                '<Say language="hi-IN">'
                'Main aapko ek human agent se connect kar rahi hoon. Kripya kuch der pratiksha karein.'
                '</Say>'
            ),
            media_type="application/xml",
        )

    # Process through RAG pipeline
    try:
        # Embed speech result as a query
        query_embedding = get_embedding(SpeechResult)

        # Search for relevant chunks
        if resolved_company_id:
            chunks = match_chunks(query_embedding, resolved_company_id, match_count=5)
        else:
            chunks = []

        # Build context
        rag_context = build_rag_context(chunks) if chunks else "No specific knowledge found."

        # Build prompt
        system_prompt = f"""You are an outbound calling agent for {company_name}.

You called this customer. Your entire knowledge comes ONLY from the
company document excerpts provided below.

STRICT RULES — NEVER BREAK THESE:
1. Answer ONLY using the CONTEXT below. Nothing else.
2. If the answer is NOT in the context → say exactly:
   "Iske baare mein main aapko hamare team se connect karunga.
    Kya aap callback ke liye available rahenge?"
3. NEVER use your own training knowledge.
4. NEVER make up prices, dates, names, or policies.
5. For factual questions (timings, prices, services), give the COMPLETE answer with ALL details from the context.
6. Respond in the same language the customer used.
7. If customer says not interested → politely end:
   "Theek hai, aapka samay dene ke liye shukriya. Namaste."
8. If customer is interested → say:
   "Bahut accha! Main aapke liye ek team member se callback arrange karta hoon."
   Then set is_hot_lead = True.

COMPANY DOCUMENT CONTEXT:
{rag_context}

If CONTEXT is empty or does not contain relevant information,
immediately escalate — do not attempt to answer from general knowledge."""

        user_prompt = f"Customer asked: {SpeechResult}"

        # Generate AI response with higher token limit for detailed answers
        ai_response = generate_response(system_prompt, user_prompt, max_tokens=500)

    except Exception as e:
        print(f"HANDLE_SPEECH ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        ai_response = (
            "Maaf karein, main abhi aapki madad nahi kar pa rahi hoon. "
            "Kripya kuch der mein dobara prayas karein."
        )

    # Update transcript with AI response
    if call_log:
        existing = call_log.get("transcript") or ""
        updated_transcript = f"{existing}\nAssistant: {ai_response}"
        update_call_log(CallSid, {"transcript": updated_transcript})

    # Build gather URL with company_id preserved for subsequent turns
    gather_url = f"{settings.PUBLIC_BASE_URL}/api/voice/handle-speech"
    if company_id:
        gather_url += f"?company_id={company_id}"

    # Use Twilio <Say> for TTS (Sarvam base64 <Play> does not work)
    twiml_body = (
        f'<Say language="hi-IN">{ai_response}</Say>'
        f'<Gather input="speech" action="{gather_url}" '
        f'speechTimeout="auto" language="hi-IN" timeout="15">'
        f'</Gather>'
    )

    return Response(
        content=_build_twiml(twiml_body),
        media_type="application/xml",
    )


@router.post("/call-status")
async def call_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: str = Form(default="0"),
):
    """Twilio call status callback.

    Updates call_logs, campaigns, and contacts with the final status.
    """
    duration_sec = 0
    try:
        duration_sec = int(CallDuration)
    except (ValueError, TypeError):
        pass

    # Update call_log
    update_call_log(CallSid, {
        "status": CallStatus,
        "duration_seconds": duration_sec,
        "ended_at": "now()",
    })

    # Get the call log to find associated campaign/contact
    call_log = get_call_log_by_sid(CallSid)
    if not call_log:
        return {"success": True}

    campaign_id = call_log.get("campaign_id")
    contact_id = call_log.get("contact_id")

    # Update campaign counters
    if campaign_id and CallStatus in ("completed", "failed", "no-answer", "busy"):
        increment_campaign_called(campaign_id)
        if CallStatus == "completed":
            increment_campaign_connected(campaign_id)
        
        # Check if all contacts are called -> mark campaign completed
        campaign = get_campaign(campaign_id)
        if campaign and campaign.get("called", 0) >= campaign.get("total_contacts", 0):
            update_campaign_status(campaign_id, "completed")

    # Update contact status
    if CallStatus in ("completed", "failed", "no-answer", "busy"):
        contact_status_map = {
            "completed": "called",
            "failed": "failed",
            "no-answer": "pending",
            "busy": "pending",
        }
        if contact_id:
            update_contact_status(contact_id, contact_status_map.get(CallStatus, "called"))

    return {"success": True}
