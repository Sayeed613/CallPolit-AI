from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.supabase_client import (
    get_pending_contacts,
    create_campaign,
    update_campaign_status,
    create_call_log,
)
from services.twilio_service import make_call
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/campaign", tags=["campaign"])


class LaunchRequest(BaseModel):
    company_id: str
    campaign_name: str
    calls_per_minute: int = 2


@router.post("/launch")
async def launch_campaign(
    req: LaunchRequest,
    user_id: str = Depends(get_current_user),
):
    """Create a campaign and schedule outbound calls via APScheduler.

    For each contact, schedules a call with delay:
        delay_seconds = index * (60 / calls_per_minute)
    """
    # Ownership check — user must own this company
    from services.supabase_client import verify_company_ownership
    verify_company_ownership(req.company_id, user_id)

    # Mode gate — only outbound and both plans can launch campaigns
    from services.supabase_client import get_company_mode
    company_mode = get_company_mode(req.company_id)
    if company_mode == "inbound":
        raise HTTPException(
            status_code=403,
            detail="Campaign launch is not available on the Inbound plan. Upgrade to Outbound or Both."
        )

    if req.calls_per_minute < 1:
        raise HTTPException(
            status_code=400,
            detail="calls_per_minute must be at least 1",
        )

    # 1. Fetch pending contacts
    contacts = get_pending_contacts(req.company_id)
    if not contacts:
        raise HTTPException(
            status_code=400,
            detail="No pending contacts found for this company",
        )

    total_contacts = len(contacts)

    # 2. Create campaign record
    try:
        campaign = create_campaign(req.company_id, req.campaign_name, total_contacts)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create campaign: {str(e)}",
        )

    campaign_id = campaign["id"]

    # 3. Schedule calls using global APScheduler (persists beyond request)
    try:
        from apscheduler.triggers.date import DateTrigger
        from services.scheduler import get_scheduler

        scheduler = get_scheduler()

        delay_between = 60 / req.calls_per_minute  # seconds

        for i, contact in enumerate(contacts):
            delay_seconds = i * delay_between
            run_time = datetime.now().timestamp() + delay_seconds

            scheduler.add_job(
                _place_call,
                trigger=DateTrigger(
                    run_date=datetime.fromtimestamp(run_time)
                ),
                args=[contact["phone"], campaign_id, contact["id"]],
                id=f"call_{campaign_id}_{contact['id']}",
                replace_existing=True,
            )

    except Exception as e:
        # Mark campaign as failed if scheduling fails
        update_campaign_status(campaign_id, "failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to schedule calls: {str(e)}",
        )

    return {
        "success": True,
        "campaign_id": campaign_id,
        "total_contacts": total_contacts,
        "status": "running",
    }


import asyncio

async def _place_call(to_phone: str, campaign_id: str, contact_id: str) -> None:
    """Place a single call in a thread pool and log it. Called by APScheduler."""
    try:
        call_sid = await asyncio.to_thread(make_call, to_phone, campaign_id, contact_id)
        create_call_log(campaign_id, contact_id, call_sid, status="initiated")
    except Exception as e:
        print(f"Failed to place call to {to_phone}: {e}")
