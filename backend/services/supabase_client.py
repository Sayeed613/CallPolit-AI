import logging
from datetime import datetime, timezone

from supabase import create_client, Client
from fastapi import HTTPException
from config.settings import settings

logger = logging.getLogger(__name__)

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


def increment_campaign_counter(campaign_id: str, field: str, amount: int = 1) -> bool:
    """Increment a numeric field in a campaign.

    Uses read-modify-write via REST API (the SQL RPC function wasn't migrated to DB).
    """
    try:
        # Read current value
        result = (
            supabase.table("campaigns")
            .select(field)
            .eq("id", campaign_id)
            .single()
            .execute()
        )
        if not result.data:
            logger.warning(f"Campaign {campaign_id} not found for counter increment")
            return False

        current = result.data.get(field, 0) or 0
        new_value = current + amount

        # Write incremented value
        supabase.table("campaigns").update({
            field: new_value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", campaign_id).execute()

        return True
    except Exception as e:
        logger.error(f"Error incrementing campaign counter: {e}")
        return False


def check_campaign_completion(campaign_id: str) -> bool:
    """Check if a campaign should be marked as completed and auto-complete if so.

    Uses direct REST API calls instead of SQL RPC (not migrated to DB).
    """
    try:
        result = (
            supabase.table("campaigns")
            .select("total_contacts,connected,unreachable,invalid_count,status,launched_at")
            .eq("id", campaign_id)
            .single()
            .execute()
        )
        if not result.data:
            return False

        c = result.data
        total = c.get("total_contacts", 0) or 0
        processed = (c.get("connected", 0) or 0) + (c.get("unreachable", 0) or 0) + (c.get("invalid_count", 0) or 0)

        now_iso = datetime.now(timezone.utc).isoformat()

        if total > 0 and processed >= total:
            supabase.table("campaigns").update({
                "status": "completed",
                "completed_at": now_iso,
                "updated_at": now_iso,
            }).eq("id", campaign_id).execute()
            return True

        # Safety valve: force complete if running > 24 hours and called >= total
        if c.get("status") == "running" and c.get("launched_at"):
            try:
                started = datetime.fromisoformat(c["launched_at"].replace("Z", "+00:00"))
                elapsed = (datetime.now(timezone.utc) - started).total_seconds()
                if elapsed > 86400 and processed >= total:
                    supabase.table("campaigns").update({
                        "status": "completed",
                        "completed_at": now_iso,
                        "updated_at": now_iso,
                    }).eq("id", campaign_id).execute()
                    return True
            except (ValueError, TypeError):
                pass

        return False
    except Exception as e:
        logger.error(f"Error checking campaign completion: {e}")
        return False


def verify_company_ownership(company_id: str, user_id: str) -> bool:
    """Verify that a user owns a company."""
    try:
        result = (
            supabase.table("companies")
            .select("id")
            .eq("id", company_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=403, detail="You do not have access to this resource")
        return True
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying ownership: {str(e)}")
