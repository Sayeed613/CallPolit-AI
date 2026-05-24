import asyncio
import logging
from datetime import datetime
from typing import Optional

from services.twilio_service import initiate_call
from services.supabase_client import supabase, increment_campaign_counter, check_campaign_completion
from config.settings import settings

logger = logging.getLogger(__name__)

# Track active campaign tasks
_active_tasks: dict[str, asyncio.Task] = {}
_paused_campaigns: set[str] = set()


async def run_campaign(campaign_id: str, company_id: str):
    """Run a campaign by processing contacts at the configured rate."""
    try:
        campaign = (
            supabase.table("campaigns")
            .select("*")
            .eq("id", campaign_id)
            .single()
            .execute()
        )
        if not campaign.data:
            logger.error(f"Campaign {campaign_id} not found")
            return

        data = campaign.data
        calls_per_minute = data.get("calls_per_minute", 5)
        delay_between_calls = 60.0 / calls_per_minute

        contacts = (
            supabase.table("contacts")
            .select("*")
            .eq("company_id", company_id)
            .execute()
        )

        contact_list = contacts.data if contacts.data else []
        total = len(contact_list)

        supabase.table("campaigns").update({
            "total_contacts": total,
            "status": "running",
            "launched_at": datetime.utcnow().isoformat(),
        }).eq("id", campaign_id).execute()

        for idx, contact in enumerate(contact_list):
            if _paused_campaigns.isdisjoint({campaign_id}):
                if campaign_id not in _active_tasks:
                    break

                # Initiate call via voice service
                company = (
                    supabase.table("companies")
                    .select("twilio_phone")
                    .eq("id", company_id)
                    .single()
                    .execute()
                )
                twilio_phone = company.data.get("twilio_phone", "") if company.data else ""

                # Check if Twilio is actually configured before calling
                if not twilio_phone and not settings.TWILIO_PHONE_NUMBER:
                    logger.error(f"Campaign {campaign_id}: No Twilio phone number configured. Stopping campaign.")
                    supabase.table("campaigns").update({
                        "status": "draft",
                    }).eq("id", campaign_id).execute()
                    break

                success = await initiate_call(
                    to_phone=contact["phone"],
                    from_phone=twilio_phone,
                    company_id=company_id,
                    campaign_id=campaign_id,
                    contact_id=contact["id"],
                    contact_name=contact.get("name", ""),
                )

                if not success:
                    logger.warning(f"Campaign {campaign_id}: Call to {contact['phone']} failed")
                    # Still increment but don't stop the campaign for a single failure

                await asyncio.sleep(delay_between_calls)
            else:
                # Campaign is paused
                while campaign_id in _paused_campaigns:
                    await asyncio.sleep(5)

                if campaign_id not in _active_tasks:
                    break

        # Check completion
        await asyncio.sleep(2)
        check_campaign_completion(campaign_id)

    except asyncio.CancelledError:
        logger.info(f"Campaign {campaign_id} cancelled")
    except Exception as e:
        logger.error(f"Campaign {campaign_id} error: {e}")
        supabase.table("campaigns").update({
            "status": "draft",
        }).eq("id", campaign_id).execute()
    finally:
        _active_tasks.pop(campaign_id, None)
        _paused_campaigns.discard(campaign_id)


def start_campaign(campaign_id: str, company_id: str) -> bool:
    """Start a campaign asynchronously."""
    if campaign_id in _active_tasks:
        logger.warning(f"Campaign {campaign_id} already running")
        return False

    task = asyncio.create_task(run_campaign(campaign_id, company_id))
    _active_tasks[campaign_id] = task
    return True


def pause_campaign(campaign_id: str) -> bool:
    """Pause a running campaign."""
    if campaign_id not in _active_tasks:
        return False
    _paused_campaigns.add(campaign_id)
    supabase.table("campaigns").update({"status": "paused"}).eq("id", campaign_id).execute()
    return True


def resume_campaign(campaign_id: str) -> bool:
    """Resume a paused campaign."""
    if campaign_id not in _paused_campaigns:
        return False
    _paused_campaigns.discard(campaign_id)
    supabase.table("campaigns").update({"status": "running"}).eq("id", campaign_id).execute()
    return True


def stop_campaign(campaign_id: str) -> bool:
    """Stop a running campaign."""
    task = _active_tasks.pop(campaign_id, None)
    if task:
        task.cancel()
        _paused_campaigns.discard(campaign_id)
        supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()
        return True
    return False


def get_active_campaigns() -> list[str]:
    """Get list of currently running campaign IDs."""
    return list(_active_tasks.keys())
