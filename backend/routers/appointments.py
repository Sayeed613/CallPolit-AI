from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date

from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user

router = APIRouter()


class AppointmentCreate(BaseModel):
    company_id: str
    contact_id: Optional[str] = None
    contact_name: str = ""
    contact_phone: str = ""
    title: str = "Appointment"
    description: str = ""
    appointment_date: str
    appointment_time: str
    duration_minutes: int = 15
    booked_by: str = "ai"


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/list/{company_id}")
async def list_appointments(
    company_id: str,
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    query = supabase.table("appointments").select("*").eq("company_id", company_id)

    if status:
        query = query.eq("status", status)
    if date_from:
        query = query.gte("appointment_date", date_from)
    if date_to:
        query = query.lte("appointment_date", date_to)

    result = query.order("appointment_date", desc=False).order("appointment_time", desc=False).execute()
    return {"appointments": result.data}


@router.post("/create")
async def create_appointment(
    data: AppointmentCreate,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(data.company_id, user_id)

    result = supabase.table("appointments").insert(data.dict()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create appointment")

    return result.data[0]


@router.put("/update/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    data: AppointmentUpdate,
    user_id: str = Depends(get_current_user),
):
    existing = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Appointment not found")
    verify_company_ownership(existing.data["company_id"], user_id)

    update_data = {k: v for k, v in data.dict(exclude_none=True).items()}
    supabase.table("appointments").update(update_data).eq("id", appointment_id).execute()
    return {"success": True}


@router.delete("/delete/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    user_id: str = Depends(get_current_user),
):
    existing = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Appointment not found")
    verify_company_ownership(existing.data["company_id"], user_id)

    supabase.table("appointments").delete().eq("id", appointment_id).execute()
    return {"success": True}


@router.get("/calendar/{company_id}/{year}/{month}")
async def calendar_view(
    company_id: str,
    year: int,
    month: int,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    month_str = f"{year:04d}-{month:02d}"
    result = (
        supabase.table("appointments")
        .select("*")
        .eq("company_id", company_id)
        .like("appointment_date", f"{month_str}%")
        .order("appointment_date", desc=False)
        .execute()
    )

    # Group by date
    days: dict = {}
    for apt in result.data or []:
        d = apt["appointment_date"]
        if d not in days:
            days[d] = []
        days[d].append(apt)

    return {"year": year, "month": month, "days": days}
