from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user
from services.scheduler import start_campaign, pause_campaign, resume_campaign, stop_campaign

router = APIRouter()


class CampaignCreate(BaseModel):
    company_id: str
    name: str
    calls_per_minute: int = 5
    language: str = "auto"
    schedule_type: str = "now"
    scheduled_at: Optional[str] = None


@router.get("/list/{company_id}")
async def list_campaigns(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)
    result = (
        supabase.table("campaigns")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"campaigns": result.data}


@router.get("/get/{campaign_id}")
async def get_campaign_route(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)
    return result.data


@router.post("/create")
async def create_campaign(
    data: CampaignCreate,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(data.company_id, user_id)

    # Count contacts for this company
    contacts = (
        supabase.table("contacts")
        .select("id", count="exact")
        .eq("company_id", data.company_id)
        .execute()
    )
    total_contacts = contacts.count if hasattr(contacts, "count") else 0

    campaign_data = {
        "company_id": data.company_id,
        "name": data.name,
        "total_contacts": total_contacts,
        "calls_per_minute": data.calls_per_minute,
        "language": data.language,
        "status": "draft",
    }
    result = supabase.table("campaigns").insert(campaign_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create campaign")

    return result.data[0]


@router.post("/launch/{campaign_id}")
async def launch_campaign(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    success = start_campaign(campaign_id, result.data["company_id"])
    if not success:
        raise HTTPException(status_code=400, detail="Campaign is already running")

    return {"success": True, "status": "running"}


@router.post("/{campaign_id}/pause")
async def pause_campaign_route(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    success = pause_campaign(campaign_id)
    return {"success": success, "status": "paused"}


@router.post("/{campaign_id}/resume")
async def resume_campaign_route(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    success = resume_campaign(campaign_id)
    return {"success": success, "status": "running"}


@router.post("/{campaign_id}/force-complete")
async def force_complete_campaign(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    stop_campaign(campaign_id)
    supabase.table("campaigns").update({
        "status": "completed",
        "completed_at": datetime.utcnow().isoformat(),
    }).eq("id", campaign_id).execute()

    return {"success": True, "status": "completed"}


@router.get("/call-logs/{campaign_id}")
async def campaign_call_logs(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    logs = (
        supabase.table("call_logs")
        .select("*")
        .eq("campaign_id", campaign_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )

    return {"call_logs": logs.data}


@router.get("/stats/{campaign_id}")
async def campaign_stats(
    campaign_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    verify_company_ownership(result.data["company_id"], user_id)

    campaign = result.data
    total = campaign.get("total_contacts", 0) or 1
    connected = campaign.get("connected", 0)
    unreachable = campaign.get("unreachable", 0)
    invalid = campaign.get("invalid_count", 0)
    hot_leads = campaign.get("hot_leads", 0)
    pending = max(0, total - connected - unreachable - invalid)

    return {
        "total": total,
        "connected": connected,
        "unreachable": unreachable,
        "invalid": invalid,
        "hot_leads": hot_leads,
        "pending": pending,
        "connection_rate": round((connected / total) * 100, 1) if total > 0 else 0,
        "progress": round(((connected + unreachable + invalid) / total) * 100, 1) if total > 0 else 0,
    }
