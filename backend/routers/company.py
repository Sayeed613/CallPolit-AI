from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user

router = APIRouter()


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    mode: Optional[str] = None
    verification_level: Optional[int] = None
    language_preference: Optional[list[str]] = None
    escalation_phone: Optional[str] = None
    business_hours_start: Optional[str] = None
    business_hours_end: Optional[str] = None
    after_hours_message: Optional[str] = None
    twilio_phone_number: Optional[str] = None


@router.get("/get")
async def get_company(user_id: str = Depends(get_current_user)):
    result = supabase.table("companies").select("*").eq("user_id", user_id).execute()
    if not result.data:
        return None
    return result.data[0]


@router.post("/create")
async def create_company(
    name: str,
    industry: str = "",
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("companies").insert({
        "user_id": user_id,
        "name": name,
        "industry": industry,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create company")
    return result.data[0]


@router.put("/update/{company_id}")
async def update_company(
    company_id: str,
    req: CompanyUpdate,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    allowed = [
        "name", "industry", "verification_level", "language_preference",
        "escalation_phone", "business_hours_start", "business_hours_end",
        "after_hours_message", "mode", "twilio_phone_number",
    ]
    update_data = {k: v for k, v in req.dict(exclude_none=True).items() if k in allowed}

    supabase.table("companies").update(update_data).eq("id", company_id).execute()
    return {"success": True}


@router.delete("/delete/{company_id}")
async def delete_company(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    # Cascade delete all related data
    supabase.table("appointments").delete().eq("company_id", company_id).execute()
    supabase.table("document_chunks").delete().eq("company_id", company_id).execute()
    supabase.table("documents").delete().eq("company_id", company_id).execute()
    supabase.table("call_logs").delete().eq("company_id", company_id).execute()
    supabase.table("campaigns").delete().eq("company_id", company_id).execute()
    supabase.table("contacts").delete().eq("company_id", company_id).execute()
    supabase.table("companies").delete().eq("id", company_id).execute()

    return {"success": True}
