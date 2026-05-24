import os
import logging
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Say, Gather, Dial, Record

from config.settings import settings
from services.supabase_client import supabase, increment_campaign_counter, check_campaign_completion

logger = logging.getLogger(__name__)

# Lazy Twilio client init
_twilio_client: Optional[Client] = None


def get_twilio_client() -> Client:
    global _twilio_client
    if _twilio_client is None:
        _twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    return _twilio_client


async def initiate_call(
    to_phone: str,
    from_phone: str,
    company_id: str,
    campaign_id: str,
    contact_id: str,
    contact_name: str = "",
) -> bool:
    """Initiate an outbound call via Twilio."""
    try:
        base_url = settings.PUBLIC_BASE_URL
        webhook_url = urljoin(base_url.rstrip("/") + "/", f"api/voice/outbound-call?company_id={company_id}&campaign_id={campaign_id}&contact_id={contact_id}&contact_name={contact_name}")

        client = get_twilio_client()
        call = client.calls.create(
            url=webhook_url,
            to=to_phone,
            from_=from_phone or settings.TWILIO_PHONE_NUMBER,
            status_callback=urljoin(base_url.rstrip("/") + "/", f"api/voice/call-status?company_id={company_id}&campaign_id={campaign_id}&contact_id={contact_id}"),
            status_callback_event=["completed", "answered", "busy", "no-answer", "failed"],
            status_callback_method="POST",
            timeout=30,
        )

        # Insert call log
        supabase.table("call_logs").insert({
            "campaign_id": campaign_id,
            "company_id": company_id,
            "contact_id": contact_id,
            "contact_name": contact_name,
            "contact_phone": to_phone,
            "caller_phone": from_phone or settings.TWILIO_PHONE_NUMBER,
            "status": "queued",
            "direction": "outbound",
            "twilio_call_sid": call.sid,
        }).execute()

        return True
    except Exception as e:
        logger.error(f"Twilio initiate call error: {e}")
        return False


def build_voice_twiml(
    message: str,
    language: str = "en",
    company_name: str = "Business",
) -> str:
    """Build TwiML for voice response."""
    response = VoiceResponse()

    # Map language to voice
    voice_map = {
        "en": {"voice": "Polly.Joanna", "language": "en-US"},
        "hi": {"voice": "Polly.Aditi", "language": "hi-IN"},
        "kn": {"voice": "Polly.Aditi", "language": "kn-IN"},
        "ta": {"voice": "Polly.Aditi", "language": "ta-IN"},
        "te": {"voice": "Polly.Aditi", "language": "te-IN"},
        "ml": {"voice": "Polly.Aditi", "language": "ml-IN"},
        "bn": {"voice": "Polly.Aditi", "language": "bn-IN"},
        "gu": {"voice": "Polly.Aditi", "language": "gu-IN"},
        "mr": {"voice": "Polly.Aditi", "language": "mr-IN"},
    }

    voice_config = voice_map.get(language, voice_map["en"])

    say = Say(message, voice=voice_config["voice"], language=voice_config["language"])
    response.append(say)

    # Gather input
    gather = Gather(
        input="speech",
        timeout=5,
        speech_timeout="auto",
        speech_model="phone_call",
        action="/api/voice/gather",
        method="POST",
    )
    response.append(gather)

    return str(response)


def build_gather_twiml(message: str, language: str = "en") -> str:
    """Build TwiML for gathering speech input."""
    response = VoiceResponse()

    voice_map = {
        "en": {"voice": "Polly.Joanna", "language": "en-US"},
        "hi": {"voice": "Polly.Aditi", "language": "hi-IN"},
    }
    voice_config = voice_map.get(language, voice_map["en"])

    say = Say(message, voice=voice_config["voice"], language=voice_config["language"])
    response.append(say)

    gather = Gather(
        input="speech",
        timeout=5,
        speech_timeout="auto",
        speech_model="phone_call",
        action="/api/voice/gather",
        method="POST",
    )
    response.append(gather)

    return str(response)


def end_call_twiml(message: str = "", language: str = "en") -> str:
    """Build TwiML to end the call."""
    response = VoiceResponse()
    if message:
        voice_map = {
            "en": {"voice": "Polly.Joanna", "language": "en-US"},
            "hi": {"voice": "Polly.Aditi", "language": "hi-IN"},
        }
        voice_config = voice_map.get(language, voice_map["en"])
        say = Say(message, voice=voice_config["voice"], language=voice_config["language"])
        response.append(say)
    response.hangup()
    return str(response)


def handle_call_status(status: str, call_data: dict) -> None:
    """Handle Twilio call status callback."""
    company_id = call_data.get("company_id")
    campaign_id = call_data.get("campaign_id")
    contact_id = call_data.get("contact_id")
    call_sid = call_data.get("CallSid")
    call_duration = float(call_data.get("CallDuration", 0))

    # Update call log
    update_data = {"status": status}
    if call_duration > 0:
        update_data["duration"] = call_duration
    if status in ["completed", "no-answer", "busy", "failed"]:
        update_data["ended_at"] = datetime.utcnow().isoformat()

    supabase.table("call_logs").update(update_data).eq("twilio_call_sid", call_sid).execute()

    if not campaign_id:
        return

    # Update campaign counters
    MAX_RETRIES = 3

    if status == "completed" and call_duration > 5:
        increment_campaign_counter(campaign_id, "connected")
    elif status in ["no-answer", "busy", "failed"]:
        # Check retry count
        log = supabase.table("call_logs").select("retry_count").eq("twilio_call_sid", call_sid).single().execute()
        retry_count = (log.data.get("retry_count", 0) if log.data else 0) + 1
        supabase.table("call_logs").update({"retry_count": retry_count}).eq("twilio_call_sid", call_sid).execute()

        if retry_count >= MAX_RETRIES:
            increment_campaign_counter(campaign_id, "unreachable")

    # Check if campaign should be completed
    check_campaign_completion(campaign_id)
