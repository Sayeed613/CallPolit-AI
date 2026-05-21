"""Global APScheduler singleton.

Created lazily on first use so the asyncio event loop is guaranteed
to be running when the scheduler starts.

Includes a periodic job that scans for contacts needing retry calls.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

_scheduler: AsyncIOScheduler | None = None


async def _scan_retry_eligible_contacts():
    """Periodic scan for contacts that need retry calls.

    Runs every 5 minutes. Finds contacts where:
    - status = 'pending'
    - retry_count < 3
    - next_retry_at <= now (or NULL)
    """
    try:
        from services.supabase_client import get_retry_eligible_contacts, supabase

        # Get all unique company_ids that have pending retries
        result = supabase.table("contacts") \
            .select("company_id, campaign_id") \
            .eq("status", "pending") \
            .lt("retry_count", 3) \
            .neq("next_retry_at", None) \
            .lte("next_retry_at", "now()") \
            .execute()

        # De-duplicate and process
        processed = set()
        for row in result.data or []:
            company_id = row.get("company_id")
            if not company_id or company_id in processed:
                continue
            processed.add(company_id)

            contacts = get_retry_eligible_contacts(company_id)
            for contact in contacts:
                if contact.get("next_retry_at") is None:
                    continue  # Skip contacts without a scheduled retry time
                # Check if there's already a running campaign for this company
                campaign_result = supabase.table("campaigns") \
                    .select("id") \
                    .eq("company_id", company_id) \
                    .eq("status", "running") \
                    .maybe_single() \
                    .execute()

                campaign = campaign_result.data
                if not campaign:
                    continue

                campaign_id = campaign["id"]
                contact_id = contact["id"]
                phone = contact.get("phone", "")
                retry_count = (contact.get("retry_count") or 0) + 1

                # Schedule the retry if not already scheduled
                job_id = f"retry_{campaign_id}_{contact_id}_{retry_count}"
                existing = _scheduler.get_job(job_id) if _scheduler else None
                if existing:
                    continue

                from apscheduler.triggers.date import DateTrigger
                _scheduler.add_job(
                    _place_retry_call,
                    trigger=DateTrigger(run_date=datetime.now()),
                    args=[phone, campaign_id, contact_id],
                    id=job_id,
                    replace_existing=True,
                )
    except Exception as e:
        import sys
        print(f"RETRY_SCAN ERROR: {e}", file=sys.stderr)


async def _place_retry_call(to_phone: str, campaign_id: str, contact_id: str) -> None:
    """Place a retry call."""
    try:
        import asyncio
        from services.twilio_service import make_call
        from services.supabase_client import create_call_log, update_call_log

        call_sid = await asyncio.to_thread(make_call, to_phone, campaign_id, contact_id)
        call_log = create_call_log(campaign_id, contact_id, call_sid, status="initiated")
        # Read retry count from contact to set on call log
        from services.supabase_client import supabase
        contact_data = supabase.table("contacts").select("retry_count").eq("id", contact_id).maybe_single().execute()
        if contact_data and contact_data.data:
            retry_number = (contact_data.data.get("retry_count") or 0) + 1
            update_call_log(call_sid, {"retry_number": retry_number})
    except Exception as e:
        print(f"RETRY_CALL FAILED: {e}")


def get_scheduler() -> AsyncIOScheduler:
    """Return the global AsyncIOScheduler, creating it on first call.

    Also registers a periodic retry scan job.
    """
    global _scheduler
    if _scheduler is None:
        from datetime import datetime
        _scheduler = AsyncIOScheduler()
        _scheduler.start()

        # Add periodic retry scan (every 5 minutes)
        try:
            _scheduler.add_job(
                _scan_retry_eligible_contacts,
                trigger=IntervalTrigger(minutes=5),
                id="retry_scan",
                replace_existing=True,
            )
        except Exception as e:
            print(f"SCHEDULER INIT ERROR: {e}")

    return _scheduler
