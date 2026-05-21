from datetime import datetime, timedelta, timezone
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
    update_contact_retry,
    mark_contact_invalid,
    update_contact_best_time,
    increment_campaign_called,
    increment_campaign_connected,
    increment_campaign_unreachable,
    increment_campaign_invalid,
    get_campaign,
    update_campaign_status,
    mark_call_log_whatsapp_pending,
    mark_call_log_callback,
    create_appointment,
)
from services.groq_service import generate_response, get_embedding
from services.rag_service import build_rag_context, detect_escalation
from config.settings import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])


# ─── Constants ───────────────────────────────────────────────────────────────────

MAX_RETRIES = 3
RETRY_DELAY_HOURS = 2
CALLING_WINDOW_START = 9   # 9 AM
CALLING_WINDOW_END = 21    # 9 PM


# ─── Helpers ─────────────────────────────────────────────────────────────────────

def _build_twiml(body: str) -> str:
    return f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>'


def _get_next_retry_time(current_retry: int) -> str | None:
    """Calculate next retry time in IST. Returns ISO string or None if max retries exceeded."""
    if current_retry >= MAX_RETRIES:
        return None

    now = datetime.now(timezone.utc)
    next_time = now.timestamp() + (RETRY_DELAY_HOURS * 3600)
    next_dt_utc = datetime.fromtimestamp(next_time, tz=timezone.utc)

    # Convert to IST (UTC + 5:30) for calling window check
    ist_offset = timedelta(hours=5, minutes=30)
    next_dt_ist = next_dt_utc + ist_offset

    # Check if next IST time falls within calling window (9 AM - 9 PM)
    hour_ist = next_dt_ist.hour
    if hour_ist < CALLING_WINDOW_START:
        # Move to 9 AM IST same day
        next_dt_ist = next_dt_ist.replace(hour=CALLING_WINDOW_START, minute=0, second=0, microsecond=0)
        # Convert back to UTC
        next_dt_utc = next_dt_ist - ist_offset
    elif hour_ist >= CALLING_WINDOW_END:
        # Move to 9 AM IST next day
        next_dt_ist = next_dt_ist.replace(hour=CALLING_WINDOW_START, minute=0, second=0, microsecond=0)
        next_dt_ist += timedelta(days=1)
        # Convert back to UTC
        next_dt_utc = next_dt_ist - ist_offset

    return next_dt_utc.isoformat()


def _schedule_retry_call(contact_id: str, phone: str, campaign_id: str, retry_count: int) -> None:
    """Schedule a retry call using APScheduler."""
    try:
        from apscheduler.triggers.date import DateTrigger
        from services.scheduler import get_scheduler

        next_retry_at = _get_next_retry_time(retry_count)
        if next_retry_at is None:
            return  # Max retries exceeded, handled by caller

        scheduler = get_scheduler()
        run_date = datetime.fromisoformat(next_retry_at)

        scheduler.add_job(
            _place_retry_call,
            trigger=DateTrigger(run_date=run_date),
            args=[phone, campaign_id, contact_id, retry_count + 1],
            id=f"retry_{campaign_id}_{contact_id}_{retry_count + 1}",
            replace_existing=True,
        )

        # Update contact with next retry info
        update_contact_retry(
            contact_id,
            retry_count,
            next_retry_at,
            "pending"
        )
    except Exception as e:
        print(f"SCHEDULE_RETRY ERROR: {e}", file=sys.stderr)


async def _place_retry_call(to_phone: str, campaign_id: str, contact_id: str, retry_number: int) -> None:
    """Place a retry call. Called by APScheduler."""
    try:
        import asyncio
        from services.twilio_service import make_call
        call_sid = await asyncio.to_thread(make_call, to_phone, campaign_id, contact_id)
        # Create call log with retry_number
        create_call_log(campaign_id, contact_id, call_sid, status="initiated")
        # Update the call log's retry_number
        update_call_log(call_sid, {"retry_number": retry_number})
    except Exception as e:
        print(f"RETRY_CALL FAILED: {e}", file=sys.stderr)


def _schedule_callback(contact_id: str, phone: str, campaign_id: str, when: str | None = None) -> None:
    """Schedule a callback requested by the customer."""
    try:
        from apscheduler.triggers.date import DateTrigger
        from services.scheduler import get_scheduler

        # Default: call back in 2 hours (same as retry)
        if when is None:
            when = _get_next_retry_time(0)
            if when is None:
                return

        scheduler = get_scheduler()
        run_date = datetime.fromisoformat(when)

        scheduler.add_job(
            _place_retry_call,
            trigger=DateTrigger(run_date=run_date),
            args=[phone, campaign_id, contact_id, 0],
            id=f"callback_{campaign_id}_{contact_id}",
            replace_existing=True,
        )
    except Exception as e:
        print(f"SCHEDULE_CALLBACK ERROR: {e}", file=sys.stderr)


def _is_wrong_number(transcript_text: str) -> bool:
    """Detect if customer says this is a wrong number."""
    wrong_number_phrases = [
        "galat number", "wrong number", "galat hai", "galat number hai",
        "aap kis se baat", "kaun hai aap", "aap kaun hain",
        "kisi ko nahi janta", "nahi jaanta", "pata nahi",
        "aapne kya kaha", "aap kya bol rahe", "yeh kaun hai",
    ]
    text_lower = transcript_text.lower()
    for phrase in wrong_number_phrases:
        if phrase in text_lower:
            return True
    return False


def _detect_callback_request(transcript_text: str) -> str | None:
    """Detect if customer asks to be called back later. Returns suggested time or None."""
    callback_phrases = [
        "baad mein call karo", "baad mein call karna", "phir call karo",
        "baad mein baat karenge", "abhi nahi", "baad mein karo",
        "call me later", "call back later", "later",
        "thodi der baad", "kuch der baad", "baad mein",
    ]
    text_lower = transcript_text.lower()
    for phrase in callback_phrases:
        if phrase in text_lower:
            return "2hours"  # Default: call back in 2 hours
    return None


# ─── Language Detection ─────────────────────────────────────────────────────────

def _detect_language(text: str) -> str:
    """Detect the language of the customer's speech.

    Keywords-based detection for common Indian languages.
    Falls back to 'hi-IN' (Hindi).
    """
    text_lower = text.lower().strip()
    if not text_lower:
        return "hi-IN"

    # Hindi / Hinglish indicators
    hindi_indicators = [
        "hai", "hain", "hoon", "kya", "kaise", "kyun", "kab", "kahan",
        "mujhe", "tum", "aap", "mera", "tera", "iska", "uska",
        "nahi", "haan", "theek", "accha", "chahiye", "sakta",
        "sakte", "karo", "karna", "jaana", "aana", "dena", "lena",
    ]
    # Gujarati indicators
    gujarati_indicators = [
        "chhe", "chhu", "chho", "nyo", "nyi", "kyare", "kya",
        "mare", "tame", "aapne", "nahi", "haan", "sarasa",
    ]
    # Tamil indicators
    tamil_indicators = [
        "illa", "irukku", "mudiyum", "venum", "enga", "eppadi",
        "naan", "nee", "ungal", "enna", "yaar", "epdi",
    ]
    # English indicators
    english_indicators = [
        "i want", "i would like", "can you", "please", "thank you",
        "what is", "when can", "how much", "i need", "book",
        "appointment", "schedule", "yes", "no", "sure", "okay",
    ]

    # Count matches (using words, not substrings, for accuracy)
    words = text_lower.split()

    def score(indicators):
        return sum(1 for ind in indicators if ind in words or ind in text_lower)

    scores = {
        "hi-IN": score(hindi_indicators),
        "gu-IN": score(gujarati_indicators),
        "ta-IN": score(tamil_indicators),
        "en-IN": score(english_indicators),
    }

    # Return the language with highest score; if low confidence, use Hindi
    best = max(scores, key=scores.get)
    if scores[best] >= 2:
        return best

    # Check for English dominance if few Hindi matches
    en_words = sum(1 for w in words if w.isascii() and w.isalpha() and len(w) > 2)
    total_words = sum(1 for w in words if w.isalpha())
    if total_words > 2 and (en_words / total_words) > 0.6:
        return "en-IN"

    return "hi-IN"


# ─── Appointment Booking ────────────────────────────────────────────────────────

import re

APPOINTMENT_PATTERN = re.compile(
    r"\[APPOINTMENT:\s*name=([^,\]]+),\s*date=(\d{4}-\d{2}-\d{2}),\s*time=(\d{2}:\d{2})(?:,\s*notes=([^,\]]*))?\]"
)


def _parse_appointment_marker(text: str) -> dict | None:
    """Parse appointment booking marker from AI response.

    Expected format:
        [APPOINTMENT: name=Patient Name, date=2025-07-20, time=16:00]
        [APPOINTMENT: name=Patient Name, date=2025-07-20, time=16:00, notes=Follow-up]

    Returns dict with keys: name, date, time, notes (or None if not found)
    """
    match = APPOINTMENT_PATTERN.search(text)
    if not match:
        return None
    return {
        "name": match.group(1).strip(),
        "date": match.group(2).strip(),
        "time": match.group(3).strip(),
        "notes": match.group(4).strip() if match.group(4) else "",
    }


# ─── Twilio Webhooks ─────────────────────────────────────────────────────────────


def _lookup_company_by_phone(phone: str) -> tuple[str | None, str]:
    """Look up a company by their Twilio phone number."""
    try:
        company = get_company_by_phone(phone)
        if company:
            return company["id"], company.get("name", "CallPilot AI")
    except Exception:
        pass

    try:
        all_companies = supabase.table("companies").select("*").execute()
        for c in all_companies.data:
            tp = c.get("twilio_phone", "")
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
    """Twilio outbound call webhook (called when customer answers)."""
    try:
        call_log = create_call_log(None, None, CallSid, status=CallStatus)
    except Exception:
        pass

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
        generic_embedding = get_embedding("company information and services overview")
        if company_id:
            chunks = match_chunks(generic_embedding, company_id, match_count=2)
            context = build_rag_context(chunks) if chunks else "No information available."
        else:
            context = "No information available."

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

    if not greeting:
        greeting = f"Namaste! Main {company_name} ki or se bol rahi hoon. Aapki kaise madad kar sakti hoon?"

    gather_url = f"{settings.PUBLIC_BASE_URL}/api/voice/handle-speech"
    if company_id:
        gather_url += f"?company_id={company_id}"

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

    New features:
    - Wrong number detection -> mark contact invalid
    - Callback request detection -> schedule follow-up call
    - Smart timing -> store best call time after successful interaction
    """
    if not SpeechResult.strip():
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

    call_log = get_call_log_by_sid(CallSid)
    resolved_company_id = company_id

    company_name = "CallPilot AI"
    if resolved_company_id:
        company = get_company(resolved_company_id)
        if company:
            company_name = company.get("name", "CallPilot AI")

    # Update transcript
    if call_log:
        existing = call_log.get("transcript") or ""
        updated_transcript = f"{existing}\nCustomer: {SpeechResult}"
        update_call_log(CallSid, {"transcript": updated_transcript})

    # ─── Wrong Number Detection ─────────────────────────────────────────
    if _is_wrong_number(SpeechResult):
        # Get contact_id from call_log
        contact_id = call_log.get("contact_id") if call_log else None
        campaign_id = call_log.get("campaign_id") if call_log else None

        if contact_id:
            mark_contact_invalid(contact_id, "wrong_number")
        if campaign_id:
            increment_campaign_invalid(campaign_id)

        update_call_log(CallSid, {"outcome": "invalid"})
        return Response(
            content=_build_twiml(
                '<Say language="hi-IN">'
                'Maaf karein, galat number. Aapka din shubh ho. Namaste.'
                '</Say><Hangup/>'
            ),
            media_type="application/xml",
        )

    # ─── Callback Request Detection ─────────────────────────────────────
    callback_detected = _detect_callback_request(SpeechResult)
    if callback_detected:
        contact_id = call_log.get("contact_id") if call_log else None
        campaign_id = call_log.get("campaign_id") if call_log else None

        if contact_id and campaign_id:
            contact = supabase.table("contacts").select("phone").eq("id", contact_id).maybe_single().execute()
            phone = contact.data.get("phone") if contact and contact.data else None
            if phone:
                next_retry_at = _get_next_retry_time(0)
                _schedule_callback(contact_id, phone, campaign_id, next_retry_at)
                if call_log:
                    mark_call_log_callback(CallSid, next_retry_at)

        return Response(
            content=_build_twiml(
                '<Say language="hi-IN">'
                'Theek hai! Main aapko dobara call karunga.'
                ' Aapke samay ke liye dhanyavaad. Namaste.'
                '</Say><Hangup/>'
            ),
            media_type="application/xml",
        )

    # ─── Check for escalation ───────────────────────────────────────────
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

    # ─── RAG Pipeline ──────────────────────────────────────────────────
    try:
        query_embedding = get_embedding(SpeechResult)

        if resolved_company_id:
            chunks = match_chunks(query_embedding, resolved_company_id, match_count=5)
        else:
            chunks = []

        rag_context = build_rag_context(chunks) if chunks else "No specific knowledge found."

        # Include recent transcript so the AI knows the conversation history
        recent_history = ""
        if call_log:
            transcript = call_log.get("transcript") or ""
            if transcript:
                # Take last ~5 lines of transcript for context
                lines = transcript.split("\n")
                recent_history = "\n".join(lines[-10:])

        system_prompt = f"""You are a calling agent for {company_name}.

Your entire knowledge comes ONLY from the
company document excerpts provided below.

STRICT RULES — NEVER BREAK THESE:
1. LANGUAGE: First detect the customer's language (Hindi, Hinglish,
   Gujarati, Tamil, or English). Then respond in EXACTLY that language.
   NEVER switch languages mid-conversation. Match their language precisely.
2. Answer ONLY using the CONTEXT below. Nothing else.
3. If the answer is NOT in the context -> say exactly:
   "Iske baare mein main aapko hamare team se connect karunga.
    Kya aap callback ke liye available rahenge?"
4. NEVER use your own training knowledge.
5. NEVER make up prices, dates, names, or policies.
6. APPOINTMENT BOOKING — This is VERY IMPORTANT:
   - If customer asks to book an appointment ("Mujhe appointment chahiye",
     "kal 4 baje", "appointment lena hai", etc.), ask them to confirm
     the date and time.
   - When the customer CONFIRMS the appointment, end your response with
     this EXACT format on a new line (do NOT include in spoken text):
     [APPOINTMENT: name=<customer_name>, date=YYYY-MM-DD, time=HH:MM]
     Use the customer's name from context or the conversation.
   - If they don't confirm, do NOT add the marker.
7. If customer says not interested -> politely end:
   "Theek hai, aapka samay dene ke liye shukriya. Namaste."
8. If customer is interested -> say:
   "Bahut accha! Main aapke liye ek team member se callback arrange karta hoon."

COMPANY DOCUMENT CONTEXT:
{rag_context}

RECENT CONVERSATION HISTORY (for context):
{recent_history}

If CONTEXT is empty or does not contain relevant information,
immediately escalate."""
        user_prompt = f"Customer said: {SpeechResult}"
        ai_response = generate_response(system_prompt, user_prompt, max_tokens=500)

        # ─── Smart Timing Learning ─────────────────────────────────────
        # If call is going well (we got a meaningful response), store best time
        if call_log:
            contact_id = call_log.get("contact_id")
            if contact_id and len(SpeechResult) > 10:
                now_utc = datetime.now(timezone.utc)
                ist_dt = now_utc + timedelta(hours=5, minutes=30)
                best_time_str = f"{ist_dt.hour:02d}:{ist_dt.minute:02d}"
                # Only update if no best time exists yet
                contact_data = supabase.table("contacts").select("best_call_time").eq("id", contact_id).maybe_single().execute()
                if contact_data and contact_data.data and not contact_data.data.get("best_call_time"):
                    update_contact_best_time(contact_id, best_time_str)

    except Exception as e:
        print(f"HANDLE_SPEECH ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        ai_response = (
            "Maaf karein, main abhi aapki madad nahi kar pa rahi hoon. "
            "Kripya kuch der mein dobara prayas karein."
        )

    # ─── Appointment Booking Extraction ────────────────────────────────
    # Check if the AI booked an appointment and parse the marker
    spoken_response = ai_response
    appointment_data = _parse_appointment_marker(ai_response)
    if appointment_data:
        # Strip the marker from the spoken response
        spoken_response = APPOINTMENT_PATTERN.sub("", ai_response).strip()

        # Get caller info from call_log
        call_log_id = call_log["id"] if call_log else None
        contact_id = call_log.get("contact_id") if call_log else None
        customer_phone = ""

        # Try to get the phone number from contact or caller ID
        if contact_id:
            try:
                contact_res = supabase.table("contacts").select("phone, name").eq("id", contact_id).maybe_single().execute()
                if contact_res and contact_res.data:
                    customer_phone = contact_res.data.get("phone", "")
                    # Use contact name if AI didn't provide one
                    if not appointment_data["name"] or appointment_data["name"] == "Patient":
                        appointment_data["name"] = contact_res.data.get("name", "Customer")
            except Exception:
                pass

        if not customer_phone:
            # Fall back to the From number from call_log
            customer_phone = ""  # We don't have caller ID in call_log directly

        # Store the appointment
        if resolved_company_id:
            created = create_appointment(
                company_id=resolved_company_id,
                customer_name=appointment_data["name"],
                customer_phone=customer_phone,
                appointment_date=appointment_data["date"],
                appointment_time=appointment_data["time"],
                contact_id=contact_id,
                call_log_id=call_log_id,
                notes=appointment_data.get("notes", ""),
            )
        else:
            created = None
        if created:
            print(f"APPOINTMENT BOOKED: {appointment_data['name']} on {appointment_data['date']} at {appointment_data['time']}")

    # ─── Language Detection & Storage ─────────────────────────────────
    detected_lang = _detect_language(SpeechResult)
    if call_log:
        current_collected = call_log.get("collected_data") or {}
        if isinstance(current_collected, str):
            current_collected = {}
        current_collected["detected_language"] = detected_lang
        update_call_log(CallSid, {"collected_data": current_collected})

    # Update transcript with AI response (without appointment marker)
    if call_log:
        existing = call_log.get("transcript") or ""
        updated_transcript = f"{existing}\nAssistant: {spoken_response}"
        update_call_log(CallSid, {"transcript": updated_transcript})

    # Determine the best language code for Twilio's Say verb
    twilio_lang_map = {
        "hi-IN": "hi-IN",
        "gu-IN": "gu-IN",
        "ta-IN": "ta-IN",
        "en-IN": "en-IN",
    }
    say_language = twilio_lang_map.get(detected_lang, "hi-IN")

    gather_url = f"{settings.PUBLIC_BASE_URL}/api/voice/handle-speech"
    if company_id:
        gather_url += f"?company_id={company_id}"

    twiml_body = (
        f'<Say language="{say_language}">{spoken_response}</Say>'
        f'<Gather input="speech" action="{gather_url}" '
        f'speechTimeout="auto" language="{say_language}" timeout="15">'
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

    New features:
    - Retry logic for no-answer/busy (max 3, 2hr apart, calling window)
    - WhatsApp follow-up marker for missed calls
    - Campaign completion check with unreachable/invalid counts
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
        "ended_at": datetime.utcnow().isoformat(),
    })

    call_log = get_call_log_by_sid(CallSid)
    if not call_log:
        return {"success": True}

    campaign_id = call_log.get("campaign_id")
    contact_id = call_log.get("contact_id")

    # ─── Update campaign counters ──────────────────────────────────────
    if campaign_id and CallStatus in ("completed", "failed", "no-answer", "busy"):
        increment_campaign_called(campaign_id)
        if CallStatus == "completed":
            increment_campaign_connected(campaign_id)

    # ─── Retry Logic for No-Answer / Busy ──────────────────────────────
    if CallStatus in ("no-answer", "busy") and contact_id and campaign_id:
        # Get current retry count
        contact = supabase.table("contacts").select("retry_count, phone").eq("id", contact_id).maybe_single().execute()
        if contact and contact.data:
            current_retry = contact.data.get("retry_count") or 0
            phone = contact.data.get("phone", "")

            if current_retry < MAX_RETRIES:
                # Schedule retry in 2 hours
                _schedule_retry_call(contact_id, phone, campaign_id, current_retry + 1)
                # Mark WhatsApp follow-up as pending for missed calls
                mark_call_log_whatsapp_pending(CallSid)
            else:
                # Max retries reached - mark as unreachable
                update_contact_retry(contact_id, current_retry, None, "unreachable")
                increment_campaign_unreachable(campaign_id)

        # Check if campaign should complete
        _check_campaign_completion(campaign_id)

    elif CallStatus == "completed" and contact_id:
        # ─── Update contact status to 'called' on success ──────────────
        update_contact_status(contact_id, "called")

        # Check campaign completion
        if campaign_id:
            _check_campaign_completion(campaign_id)

    elif CallStatus == "failed" and contact_id:
        # Failed calls - schedule retry (same as no-answer)
        if campaign_id:
            contact = supabase.table("contacts").select("retry_count, phone").eq("id", contact_id).maybe_single().execute()
            if contact and contact.data:
                current_retry = contact.data.get("retry_count") or 0
                phone = contact.data.get("phone", "")

                if current_retry < MAX_RETRIES:
                    _schedule_retry_call(contact_id, phone, campaign_id, current_retry + 1)
                else:
                    update_contact_retry(contact_id, current_retry, None, "unreachable")
                    increment_campaign_unreachable(campaign_id)

                _check_campaign_completion(campaign_id)

    return {"success": True}


def _check_campaign_completion(campaign_id: str) -> None:
    """Check if campaign is complete by summing unique terminal outcomes.

    Uses three counters that are mutually exclusive per contact:
    - connected: contact answered at least once
    - unreachable: contact exhausted all retries
    - invalid_count: contact was wrong number / DND

    `called` is NOT used because it's incremented per attempt (including
    retries), so it would trigger completion before retries execute.

    Fallback: If counters don't match, also check actual contact states
    in the database. This catches edge cases where scheduler jobs were
    lost on restart and contacts are stuck in "queued" state.
    """
    try:
        campaign = get_campaign(campaign_id)
        if not campaign:
            return

        total = campaign.get("total_contacts", 0)
        if total <= 0:
            return

        connected = campaign.get("connected", 0) or 0
        unreachable = campaign.get("unreachable", 0) or 0
        invalid_count = campaign.get("invalid_count", 0) or 0

        finalized = connected + unreachable + invalid_count

        if finalized >= total:
            if campaign.get("status") not in ("completed", "failed"):
                update_campaign_status(campaign_id, "completed")
            return

        # Fallback: Check actual contact states in DB
        # Count contacts that are in terminal states vs still pending/queued
        try:
            all_contacts = supabase.table("contacts") \
                .select("id, status") \
                .eq("campaign_id", campaign_id) \
                .execute()

            terminal_statuses = {"called", "unreachable", "invalid"}
            terminal = sum(1 for c in (all_contacts.data or []) if c.get("status") in terminal_statuses)
            limbo = sum(1 for c in (all_contacts.data or []) if c.get("status") in ("pending", "queued"))

            # If all contacts are in terminal states, complete the campaign
            if terminal >= total:
                update_campaign_status(campaign_id, "completed")
                return

            # If contacts are stuck in limbo for too long (no pending scheduler jobs),
            # check if campaign launched > 24h ago and no progress
            if limbo > 0 and connected == 0:
                launched_at = campaign.get("launched_at")
                if launched_at:
                    try:
                        launched = datetime.fromisoformat(launched_at.replace("Z", "+00:00"))
                        hours_elapsed = (datetime.now(timezone.utc) - launched).total_seconds() / 3600
                        if hours_elapsed > 24:
                            # Auto-mark stale queued contacts as unreachable
                            for c in (all_contacts.data or []):
                                if c.get("status") in ("pending", "queued"):
                                    supabase.table("contacts").update({
                                        "status": "unreachable",
                                    }).eq("campaign_id", campaign_id).eq("id", c.get("id")).execute()
                                    increment_campaign_unreachable(campaign_id)

                            update_campaign_status(campaign_id, "completed")
                    except Exception:
                        pass
        except Exception:
            pass
    except Exception:
        pass
