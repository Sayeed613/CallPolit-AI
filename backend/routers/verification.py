"""Verification API router for CallPilot AI.
Handles customer verification flow: initiate, send OTP, confirm OTP, get profile, lock.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from services.supabase_client import supabase, get_company
from services.verification_service import VerificationService
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/verify", tags=["verification"])
verification_service = VerificationService()


# ─── Request/Response Models ───────────────────────────────────────────────────

class InitiateRequest(BaseModel):
    company_id: str
    phone: str

class InitiateResponse(BaseModel):
    session_token: str
    verification_level: int
    questions: list[str]
    requires_otp: bool

class OtpSendRequest(BaseModel):
    company_id: str
    phone: str

class OtpSendResponse(BaseModel):
    message: str
    expires_in_seconds: int

class OtpConfirmRequest(BaseModel):
    phone: str
    otp: str

class VerifyRequest(BaseModel):
    company_id: str
    phone: str
    answers: dict

class LockRequest(BaseModel):
    company_id: str
    phone: str


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/initiate", response_model=InitiateResponse)
async def initiate_verification(
    req: InitiateRequest,
    user: dict = Depends(get_current_user),
):
    """Start verification flow for a customer.
    
    Returns session token, verification level, questions to ask, and whether OTP is required.
    """
    company = get_company(req.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    verification_level = company.get("verification_level", 1)
    
    # Get customer profile to determine questions
    customer = await verification_service.get_customer_profile(req.company_id, req.phone)
    
    questions = []
    requires_otp = False
    
    if verification_level >= 1:
        questions.append("What is your full name?")
    
    if verification_level >= 2:
        if customer and customer.get("date_of_birth"):
            questions.append("What is your date of birth?")
        if customer and customer.get("account_number"):
            questions.append("What is your account number?")
        if customer and customer.get("policy_number"):
            questions.append("What is your policy number?")
        requires_otp = True
    
    if verification_level >= 3:
        if customer and customer.get("pan_last4"):
            questions.append("What are the last 4 digits of your PAN card?")
        if customer and customer.get("aadhaar_last4"):
            questions.append("What are the last 4 digits of your Aadhaar number?")
    
    # Create session
    import secrets
    session_token = secrets.token_urlsafe(32)
    
    supabase.table("verification_sessions").insert({
        "company_id": req.company_id,
        "phone": req.phone,
        "session_token": session_token,
        "verification_level": verification_level,
        "expires_at": "now() + interval '30 minutes'",
    }).execute()
    
    return InitiateResponse(
        session_token=session_token,
        verification_level=verification_level,
        questions=questions,
        requires_otp=requires_otp,
    )


@router.post("/otp/send")
async def send_otp(
    req: OtpSendRequest,
    user: dict = Depends(get_current_user),
):
    """Send OTP to customer's registered mobile number."""
    otp = await verification_service.send_otp(req.phone)
    
    # Store OTP in session
    # Find the most recent session for this phone/company
    session = supabase.table("verification_sessions") \
        .select("*") \
        .eq("phone", req.phone) \
        .eq("company_id", req.company_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    
    if session.data:
        from datetime import datetime, timedelta, timezone
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        supabase.table("verification_sessions") \
            .update({"otp": otp, "otp_expires_at": expires_at}) \
            .eq("id", session.data[0]["id"]) \
            .execute()
    
    return {
        "message": "OTP sent successfully",
        "expires_in_seconds": 300,
    }


@router.post("/otp/confirm")
async def confirm_otp(
    req: OtpConfirmRequest,
    user: dict = Depends(get_current_user),
):
    """Confirm OTP entered by customer."""
    verified = await verification_service.verify_otp(req.phone, req.otp)
    
    if not verified:
        # Increment failed attempts
        session = supabase.table("verification_sessions") \
            .select("*") \
            .eq("phone", req.phone) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        if session.data:
            attempts = (session.data[0].get("attempts", 0) or 0) + 1
            locked = attempts >= 3
            supabase.table("verification_sessions") \
                .update({"attempts": attempts, "locked": locked}) \
                .eq("id", session.data[0]["id"]) \
                .execute()
            
            if locked:
                raise HTTPException(
                    status_code=429,
                    detail="Too many failed attempts. Account locked. Contact support.",
                )
        
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    return {"verified": True}


@router.get("/profile/{company_id}/{phone}")
async def get_profile(
    company_id: str,
    phone: str,
    user: dict = Depends(get_current_user),
):
    """Get customer profile for verification purposes."""
    profile = await verification_service.get_customer_profile(company_id, phone)
    if not profile:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Mask sensitive data
    masked = dict(profile)
    if masked.get("phone"):
        masked["phone"] = masked["phone"][:3] + "xxx" + masked["phone"][-2:]
    if masked.get("account_number"):
        masked["account_number"] = "xxxx" + masked["account_number"][-4:]
    if masked.get("pan_last4"):
        masked["pan_last4"] = "xxxx" + masked["pan_last4"][-4:] if len(masked["pan_last4"]) <= 4 else masked["pan_last4"]
    
    return masked


@router.post("/lock")
async def lock_customer(
    req: LockRequest,
    user: dict = Depends(get_current_user),
):
    """Lock a customer after max verification attempts exceeded."""
    await verification_service.lock_customer(req.company_id, req.phone)
    return {"message": "Customer locked", "phone": req.phone}


@router.post("/verify")
async def verify_customer(
    req: VerifyRequest,
    user: dict = Depends(get_current_user),
):
    """Verify customer with provided answers."""
    result = await verification_service.verify_customer(
        req.company_id, req.phone, req.answers
    )
    return result
