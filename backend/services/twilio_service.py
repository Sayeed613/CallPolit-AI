from twilio.rest import Client
from config.settings import settings

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def make_call(to_phone: str, campaign_id: str, contact_id: str) -> str:
    """Initiate an outbound call via Twilio.

    Looks up the campaign to get the company_id, then passes it
    in the webhook URL so the AI has PDF context for the call.

    Args:
        to_phone: E.164 phone number to call.
        campaign_id: UUID of the campaign.
        contact_id: UUID of the contact.

    Returns:
        The Twilio Call SID.
    """
    from services.supabase_client import get_campaign

    base = settings.PUBLIC_BASE_URL

    # Look up campaign to get company_id for PDF context
    campaign = get_campaign(campaign_id)
    company_id = campaign["company_id"] if campaign else ""
    company_param = f"?company_id={company_id}" if company_id else ""

    call = client.calls.create(
        to=to_phone,
        from_=settings.TWILIO_PHONE_NUMBER,
        url=f"{base}/api/voice/inbound{company_param}",
        status_callback=f"{base}/api/voice/call-status",
        status_callback_event=["completed", "failed", "no-answer", "busy"],
        status_callback_method="POST",
        timeout=30,
    )
    return call.sid
