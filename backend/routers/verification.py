from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from services.supabase_client import supabase
from services.auth_middleware import get_current_user
from services.verification_service import generate_otp, check_verification_level

router = APIRouter()

# In-memory OTP store (use Redis in production)
_otp_store: dict[str, dict] = {}


class OTPRequest(BaseModel):
    contact_id: str
    company_id: str


class OTPVerify(BaseModel):
    contact_id: str
    company_id: str
    otp: str


class VerificationRequest(BaseModel):
    contact_id: str
    company_id: str
    level: int = 1
    name: str = ""
    phone: str = ""
    dob: str = ""
    pan: str = ""
    aadhaar: str = ""
    account_number: str = ""
    ifsc: str = ""


@router.post("/send-otp")
async def send_otp(
    data: OTPRequest,
    user_id: str = Depends(get_current_user),
):
    """Generate and send OTP for verification."""
    contact = supabase.table("contacts").select("*").eq("id", data.contact_id).single().execute()
    if not contact.data:
        raise HTTPException(status_code=404, detail="Contact not found")

    otp = generate_otp()
    _otp_store[data.contact_id] = {
        "otp": otp,
        "expires_at": datetime.utcnow().timestamp() + 300,  # 5 minutes
    }

    # In production, send OTP via SMS/Twilio
    return {"success": True, "message": f"OTP sent to {contact.data.get('phone', '')}"}


@router.post("/verify-otp")
async def verify_otp(
    data: OTPVerify,
    user_id: str = Depends(get_current_user),
):
    """Verify an OTP."""
    otp_data = _otp_store.get(data.contact_id)
    if not otp_data:
        raise HTTPException(status_code=400, detail="No OTP requested")

    if datetime.utcnow().timestamp() > otp_data["expires_at"]:
        _otp_store.pop(data.contact_id, None)
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp_data["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    _otp_store.pop(data.contact_id, None)

    return {"success": True, "verified": True}


@router.post("/verify")
async def verify_contact(
    data: VerificationRequest,
    user_id: str = Depends(get_current_user),
):
    """Multi-level verification for a contact."""
    contact = supabase.table("contacts").select("*").eq("id", data.contact_id).single().execute()
    if not contact.data:
        raise HTTPException(status_code=404, detail="Contact not found")

    result = check_verification_level(
        contact.data,
        data.dict(),
        level=data.level,
    )

    if result["verified"]:
        supabase.table("contacts").update({
            "verified": True,
            "verification_level": data.level,
        }).eq("id", data.contact_id).execute()

    return result


@router.post("/test")
async def test_verification(
    user_id: str = Depends(get_current_user),
):
    """Test the verification flow by generating and returning an OTP."""
    otp = generate_otp()
    return {"otp": otp, "message": "In production, this would be sent via SMS"}
