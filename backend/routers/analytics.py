from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user


router = APIRouter()


def _get_campaign_ids(supabase, company_id: str) -> list[str]:
    """Get all campaign IDs for a company."""
    result = (
        supabase.table("campaigns")
        .select("id")
        .eq("company_id", company_id)
        .execute()
    )
    return [c["id"] for c in (result.data or [])]


def _query_call_logs_by_campaigns(supabase, campaign_ids: list[str], gte_date: str | None = None, status_eq: str | None = None):
    """Query call_logs filtered by campaign IDs (since call_logs has no company_id column)."""
    if not campaign_ids:
        return {"data": [], "count": 0}

    query = supabase.table("call_logs").select("id", count="exact")
    query = query.in_("campaign_id", campaign_ids)

    if gte_date:
        query = query.gte("created_at", gte_date)
    if status_eq:
        query = query.eq("status", status_eq)

    result = query.execute()
    count = result.count if hasattr(result, "count") else len(result.data or [])
    return {"data": result.data, "count": count}


@router.get("/stats/{company_id}")
async def get_analytics_stats(
    company_id: str,
    days: int = Query(30, description="Number of days to look back"),
    user_id: str = Depends(get_current_user),
):
    """Get analytics dashboard stats from real data."""
    verify_company_ownership(company_id, user_id)

    today = datetime.utcnow().date()
    lookback = today - timedelta(days=days)

    campaign_ids = _get_campaign_ids(supabase, company_id)

    # Total & connected calls via campaign_ids (call_logs has no company_id)
    total_calls = 0
    connected = 0
    total_today = 0
    connected_today = 0
    durations = []

    if campaign_ids:
        all_calls = (
            supabase.table("call_logs")
            .select("id, status, duration_seconds, created_at", count="exact")
            .in_("campaign_id", campaign_ids)
            .gte("created_at", lookback.isoformat())
            .execute()
        )
        all_count = all_calls.count if hasattr(all_calls, "count") else len(all_calls.data or [])
        total_calls = all_count

        for row in all_calls.data or []:
            created = row.get("created_at", "")
            if created >= today.isoformat():
                total_today += 1

            status = row.get("status", "")
            if status == "completed":
                connected += 1
                if created >= today.isoformat():
                    connected_today += 1

            dur = row.get("duration_seconds")
            if dur:
                durations.append(dur)

    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0
    minutes = int(avg_duration // 60)
    seconds = int(avg_duration % 60)
    avg_duration_str = f"{minutes}:{seconds:02d}"

    # Total contacts
    contacts_result = (
        supabase.table("contacts")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .execute()
    )
    total_contacts = contacts_result.count if hasattr(contacts_result, "count") else 0

    # Active campaigns
    campaigns_result = (
        supabase.table("campaigns")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .in_("status", ["running", "active"])
        .execute()
    )
    active_campaigns = campaigns_result.count if hasattr(campaigns_result, "count") else 0

    # Completed campaigns
    completed_campaigns_result = (
        supabase.table("campaigns")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .eq("status", "completed")
        .execute()
    )
    completed_campaigns = completed_campaigns_result.count if hasattr(completed_campaigns_result, "count") else 0

    # Appointments
    appointments_result = (
        supabase.table("appointments")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .gte("created_at", lookback.isoformat())
        .execute()
    )
    appointments = appointments_result.count if hasattr(appointments_result, "count") else 0

    connection_rate = round((connected / total_calls) * 100, 1) if total_calls > 0 else 0
    today_connection_rate = round((connected_today / total_today) * 100, 1) if total_today > 0 else 0

    return {
        "total_calls": total_calls,
        "connected": connected,
        "connection_rate": connection_rate,
        "avg_duration": avg_duration_str,
        "total_today": total_today,
        "connected_today": connected_today,
        "today_connection_rate": today_connection_rate,
        "active_campaigns": active_campaigns,
        "completed_campaigns": completed_campaigns,
        "total_contacts": total_contacts,
        "appointments": appointments,
    }


@router.get("/activity/{company_id}")
async def get_recent_activity(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get recent activity feed items."""
    verify_company_ownership(company_id, user_id)

    activities = []

    # Recent campaigns
    campaigns = (
        supabase.table("campaigns")
        .select("id, name, status, created_at")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    for c in campaigns.data or []:
        status_labels = {"running": "started", "completed": "completed", "paused": "paused", "draft": "created", "failed": "failed"}
        action = status_labels.get(c.get("status", ""), c.get("status", "updated"))
        activities.append({
            "type": "campaign",
            "text": f'Campaign "{c["name"]}" {action}',
            "time": c["created_at"],
            "icon": "megaphone",
        })

    # Contact activity (most recently created contacts)
    count_result = (
        supabase.table("contacts")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .execute()
    )
    total_contacts = count_result.count if hasattr(count_result, "count") else 0
    if total_contacts > 0:
        latest_contact = (
            supabase.table("contacts")
            .select("created_at")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if latest_contact.data:
            activities.append({
                "type": "contacts",
                "text": f"{total_contacts} contacts in database",
                "time": latest_contact.data[0]["created_at"],
                "icon": "users",
            })

    # Recent call logs (via campaign_ids, since call_logs has no company_id)
    campaign_ids = _get_campaign_ids(supabase, company_id)
    if campaign_ids:
        calls = (
            supabase.table("call_logs")
            .select("id, status, created_at, contact_id, campaign_id")
            .in_("campaign_id", campaign_ids)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        for call in calls.data or []:
            # Look up contact name if contact_id is available
            name = "Unknown"
            if call.get("contact_id"):
                contact_row = (
                    supabase.table("contacts")
                    .select("name, phone")
                    .eq("id", call["contact_id"])
                    .limit(1)
                    .execute()
                )
                if contact_row.data:
                    name = contact_row.data[0].get("name") or contact_row.data[0].get("phone", "Unknown")

            status_text = call.get("status", "completed")
            activities.append({
                "type": "call",
                "text": f'Call to {name} {status_text}',
                "time": call["created_at"],
                "icon": "phone",
            })

    # Sort by time descending and take top 10
    activities.sort(key=lambda x: x["time"], reverse=True)
    activities = activities[:10]

    return {"activities": activities}
