from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.supabase_client import (
    supabase,
    get_pending_contacts,
    create_campaign,
    update_campaign_status,
    create_call_log,
    get_campaign_stats,
    get_campaign,
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

    Includes retry-eligible contacts (those with retry_count < 3).
    """
    from services.supabase_client import verify_company_ownership
    verify_company_ownership(req.company_id, user_id)

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

    # 1. Check no other campaign is already running for this company
    existing_running = supabase.table("campaigns").select("id, name").eq("company_id", req.company_id).eq("status", "running").execute()
    if existing_running.data:
        running_name = existing_running.data[0].get("name", "unnamed")
        raise HTTPException(
            status_code=400,
            detail=f"A campaign is already running for this company: '{running_name}'. Complete or force-complete it first.",
        )

    # 2. Fetch pending contacts (includes retry-eligible contacts)
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

    # 3. Mark contacts as claimed by this campaign (prevents double-picking)
    for contact in contacts:
        supabase.table("contacts").update({
            "campaign_id": campaign_id,
        }).eq("id", contact["id"]).execute()

    # 4. Schedule calls using global APScheduler (persists beyond request)
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
        update_campaign_status(campaign_id, "failed")
        # Reset contacts on failure
        for contact in contacts:
            supabase.table("contacts").update({
                "campaign_id": None,
            }).eq("id", contact["id"]).execute()
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


@router.get("/{campaign_id}/stats")
async def campaign_stats(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get detailed campaign statistics.

    Returns:
        campaign_id, campaign_name, status, total_contacts,
        called, connected, hot_leads, unreachable, invalid_count,
        avg_duration_seconds, progress_pct, connect_rate_pct,
        launched_at, completed_at
    """
    # Verify ownership via campaign -> company
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from services.supabase_client import verify_company_ownership
    verify_company_ownership(campaign["company_id"], user_id)

    stats = get_campaign_stats(campaign_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {"success": True, "data": stats}


@router.post("/{campaign_id}/retry-remaining")
async def retry_remaining_contacts(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    """Schedule retry calls for contacts that didn't answer the first time.

    Scans for pending contacts with retry_count < 3 and schedules retries.
    """
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from services.supabase_client import verify_company_ownership
    verify_company_ownership(campaign["company_id"], user_id)

    from services.supabase_client import get_retry_eligible_contacts
    contacts = get_retry_eligible_contacts(campaign["company_id"])

    if not contacts:
        return {
            "success": True,
            "scheduled": 0,
            "message": "No retry-eligible contacts found",
        }

    try:
        from apscheduler.triggers.date import DateTrigger
        from services.scheduler import get_scheduler

        scheduler = get_scheduler()
        scheduled = 0

        for contact in contacts:
            retry_count = contact.get("retry_count") or 0
            job_id = f"retry_{campaign_id}_{contact['id']}_{retry_count + 1}"

            # Check if job already exists
            existing_job = scheduler.get_job(job_id)
            if existing_job:
                continue

            # Schedule immediately with 5-second spacing
            delay_seconds = scheduled * 5
            run_time = datetime.now().timestamp() + delay_seconds

            scheduler.add_job(
                _place_call,
                trigger=DateTrigger(run_date=datetime.fromtimestamp(run_time)),
                args=[contact["phone"], campaign_id, contact["id"]],
                id=job_id,
                replace_existing=True,
            )
            scheduled += 1

        return {
            "success": True,
            "scheduled": scheduled,
            "total_eligible": len(contacts),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to schedule retries: {str(e)}",
        )


import asyncio

async def _place_call(to_phone: str, campaign_id: str, contact_id: str) -> None:
    """Place a single call in a thread pool and log it. Called by APScheduler."""
    try:
        call_sid = await asyncio.to_thread(make_call, to_phone, campaign_id, contact_id)
        create_call_log(campaign_id, contact_id, call_sid, status="initiated")
    except Exception as e:
        print(f"Failed to place call to {to_phone}: {e}")


@router.post("/{campaign_id}/force-complete")
async def force_complete_campaign(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    """Force-mark remaining contacts and the campaign as completed.

    This:
    1. Resets all 'queued' contacts back to 'pending' so they can
       be called again in a future campaign
    2. Marks the campaign as 'completed'

    Useful when you want to stop a campaign early and re-use contacts.
    """
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from services.supabase_client import verify_company_ownership
    verify_company_ownership(campaign["company_id"], user_id)

    try:
        # Reset claimed contacts back to unassigned
        supabase.table("contacts").update({
            "campaign_id": None,
        }).eq("campaign_id", campaign_id).execute()

        # Mark campaign completed
        update_campaign_status(campaign_id, "completed")

        return {"success": True, "message": "Campaign completed. Queued contacts reset to pending."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete campaign: {str(e)}")