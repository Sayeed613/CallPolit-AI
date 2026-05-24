import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from services.supabase_client import supabase, verify_company_ownership
from services.auth_middleware import get_current_user

router = APIRouter()


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None
    is_vip: Optional[bool] = None
    notes: Optional[str] = None


@router.get("/list/{company_id}")
async def list_contacts(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)
    result = (
        supabase.table("contacts")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )
    return {"contacts": result.data, "count": len(result.data)}


@router.get("/get/{contact_id}")
async def get_contact(
    contact_id: str,
    user_id: str = Depends(get_current_user),
):
    result = supabase.table("contacts").select("*").eq("id", contact_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_company_ownership(result.data["company_id"], user_id)
    return result.data


@router.put("/update/{contact_id}")
async def update_contact(
    contact_id: str,
    data: ContactUpdate,
    user_id: str = Depends(get_current_user),
):
    existing = supabase.table("contacts").select("*").eq("id", contact_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_company_ownership(existing.data["company_id"], user_id)

    update_data = {k: v for k, v in data.dict(exclude_none=True).items()}
    supabase.table("contacts").update(update_data).eq("id", contact_id).execute()
    return {"success": True}


@router.delete("/delete/{contact_id}")
async def delete_contact(
    contact_id: str,
    user_id: str = Depends(get_current_user),
):
    existing = supabase.table("contacts").select("*").eq("id", contact_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_company_ownership(existing.data["company_id"], user_id)

    supabase.table("contacts").delete().eq("id", contact_id).execute()
    return {"success": True}


@router.post("/import/{company_id}")
async def import_contacts(
    company_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    verify_company_ownership(company_id, user_id)

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    contacts = []
    for row in reader:
        contact = {
            "company_id": company_id,
            "name": row.get("name", row.get("Name", "")).strip(),
            "phone": row.get("phone", row.get("Phone", row.get("mobile", ""))).strip(),
            "email": row.get("email", row.get("Email", "")).strip(),
        }
        if contact["phone"]:
            contacts.append(contact)

    if contacts:
        supabase.table("contacts").insert(contacts).execute()

    return {"imported": len(contacts)}
