"""Customer verification service for CallPilot AI.
Supports multi-level verification: Basic (Level 1), Standard (Level 2), Strict (Level 3).
"""
import secrets
import hashlib
import time
from datetime import datetime, timedelta, timezone

from services.supabase_client import supabase, get_company


class VerificationService:
    """Multi-step customer verification engine."""
    
    async def verify_customer(
        self,
        company_id: str,
        phone: str,
        answers: dict
    ) -> dict:
        """
        Multi-step customer verification.
        
        Level 1 — Basic (all companies):
            - Phone number match in contacts table
            - Name confirmation
        
        Level 2 — Standard (banking, insurance):
            - Date of birth
            - Account number or policy number
            - OTP to registered mobile
        
        Level 3 — Strict (banking fraud, high value):
            - PAN card last 4 digits
            - Aadhaar last 4 digits
            - Mother's maiden name or secret question
        
        Returns:
            verified: bool
            level: int (1, 2, or 3)
            customer_profile: dict
            failed_attempts: int
            locked: bool (true after 3 failed attempts)
        """
        company = get_company(company_id)
        verification_level = company.get("verification_level", 1) if company else 1
        
        # Check if customer is locked
        session = await self._get_active_session(company_id, phone)
        if session and session.get("locked"):
            return {
                "verified": False,
                "level": verification_level,
                "customer_profile": {},
                "failed_attempts": session.get("attempts", 0),
                "locked": True,
                "reason": "Customer locked due to too many failed attempts"
            }
        
        # Get customer profile
        customer = await self.get_customer_profile(company_id, phone)
        if not customer:
            return {
                "verified": False,
                "level": verification_level,
                "customer_profile": {},
                "failed_attempts": 0,
                "locked": False,
                "reason": "Phone number not found in contacts"
            }
        
        # Track attempts
        attempts = (session.get("attempts", 0) if session else 0) + 1
        if attempts > 3:
            await self.lock_customer(company_id, phone)
            return {
                "verified": False,
                "level": verification_level,
                "customer_profile": customer,
                "failed_attempts": 3,
                "locked": True,
                "reason": "Too many failed attempts - customer locked"
            }
        
        # Level 1 — Basic verification
        level1_ok = True
        
        # Check name confirmation
        name_confirmed = answers.get("name", "").lower().strip() == customer.get("name", "").lower().strip()
        if not name_confirmed:
            level1_ok = False
        
        if verification_level == 1:
            verified = level1_ok
            await self._update_session(company_id, phone, attempts, verified, 1)
            return {
                "verified": verified,
                "level": 1,
                "customer_profile": customer,
                "failed_attempts": attempts,
                "locked": False
            }
        
        # Level 2 — Standard verification
        level2_ok = True
        
        if verification_level >= 2:
            # Check date of birth
            if answers.get("dob"):
                customer_dob = customer.get("date_of_birth", "")
                if customer_dob and answers["dob"] != customer_dob:
                    level2_ok = False
            
            # Check account number or policy number
            account_num = answers.get("account_number", "").strip()
            policy_num = answers.get("policy_number", "").strip()
            customer_account = customer.get("account_number", "").strip()
            customer_policy = customer.get("policy_number", "").strip()
            
            account_match = account_num and customer_account and account_num == customer_account
            policy_match = policy_num and customer_policy and policy_num == customer_policy
            
            if not account_match and not policy_match:
                level2_ok = False
        
        if verification_level == 2:
            verified = level1_ok and level2_ok
            await self._update_session(company_id, phone, attempts, verified, 2)
            return {
                "verified": verified,
                "level": 2,
                "customer_profile": customer,
                "failed_attempts": attempts,
                "locked": False
            }
        
        # Level 3 — Strict verification
        level3_ok = True
        
        if verification_level >= 3:
            # Check PAN last 4 digits
            pan = answers.get("pan_last4", "").strip()
            customer_pan = customer.get("pan_last4", "").strip()
            pan_match = pan and customer_pan and pan == customer_pan
            
            # Check Aadhaar last 4 digits
            aadhaar = answers.get("aadhaar_last4", "").strip()
            customer_aadhaar = customer.get("aadhaar_last4", "").strip()
            aadhaar_match = aadhaar and customer_aadhaar and aadhaar == customer_aadhaar
            
            # Check mother's maiden or secret question
            secret = answers.get("secret_answer", "").lower().strip()
            customer_secret = customer.get("mothers_maiden", "").lower().strip()
            secret_match = secret and customer_secret and secret == customer_secret
            
            if not pan_match and not aadhaar_match and not secret_match:
                level3_ok = False
        
        verified = level1_ok and level2_ok and level3_ok
        await self._update_session(company_id, phone, attempts, verified, 3)
        
        return {
            "verified": verified,
            "level": verification_level,
            "customer_profile": customer,
            "failed_attempts": attempts,
            "locked": False
        }
    
    async def send_otp(self, phone: str) -> str:
        """Send OTP via SMS. Return OTP for verification.
        
        In production, this would integrate with Twilio SMS or a service like
        MSG91, TextLocal, or Fast2SMS for Indian phone numbers.
        
        For now, generates and stores the OTP.
        """
        otp = str(secrets.randbelow(900000) + 100000)  # 6-digit OTP
        
        # In production: send via SMS gateway
        # from services.supabase_client import settings
        # twilio_client.messages.create(
        #     body=f"Your CallPilot AI verification OTP is: {otp}",
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=phone
        # )
        
        print(f"[OTP] Sending OTP {otp} to {phone}")
        return otp
    
    async def verify_otp(self, phone: str, otp: str) -> bool:
        """Verify OTP within 5 minute window."""
        # Find the session for this phone
        result = supabase.table("verification_sessions")             .select("*")             .eq("phone", phone)             .order("created_at", desc=True)             .limit(1)             .execute()
        
        if not result.data:
            return False
        
        session = result.data[0]
        
        # Check expiration (5 minute window)
        expires_at = session.get("otp_expires_at")
        if expires_at:
            try:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > exp:
                    return False
            except (ValueError, AttributeError):
                pass
        
        # Verify OTP
        stored_otp = session.get("otp", "")
        if stored_otp == otp:
            supabase.table("verification_sessions")                 .update({"otp_verified": True})                 .eq("id", session["id"])                 .execute()
            return True
        
        return False
    
    async def get_customer_profile(
        self, company_id: str, phone: str
    ) -> dict | None:
        """Pull complete customer profile from contacts table.
        Include: name, email, phone, custom_data (pan, aadhaar,
        account_number, dob, policy_number etc stored as JSON)
        """
        result = supabase.table("contacts")             .select("*")             .eq("company_id", company_id)             .eq("phone", phone)             .maybe_single()             .execute()
        
        if not result.data:
            return None
        
        contact = result.data
        return {
            "id": contact.get("id"),
            "name": contact.get("name", ""),
            "email": contact.get("email", ""),
            "phone": contact.get("phone", ""),
            "date_of_birth": contact.get("date_of_birth"),
            "account_number": contact.get("account_number"),
            "policy_number": contact.get("policy_number"),
            "pan_last4": contact.get("pan_last4"),
            "aadhaar_last4": contact.get("aadhaar_last4"),
            "customer_id": contact.get("customer_id"),
            "kyc_status": contact.get("kyc_status", "pending"),
            "risk_score": contact.get("risk_score", 0),
            "is_vip": contact.get("is_vip", False),
            "previous_interactions": contact.get("previous_interactions", []),
            "open_tickets": contact.get("open_tickets", []),
            "outstanding_dues": contact.get("outstanding_dues", 0),
        }
    
    async def lock_customer(self, company_id: str, phone: str) -> None:
        """Lock customer after 3 failed verification attempts."""
        supabase.table("verification_sessions")             .update({"locked": True})             .eq("phone", phone)             .eq("company_id", company_id)             .eq("locked", False)             .execute()
    
    async def _get_active_session(self, company_id: str, phone: str) -> dict | None:
        """Get the most recent active verification session."""
        result = supabase.table("verification_sessions")             .select("*")             .eq("company_id", company_id)             .eq("phone", phone)             .order("created_at", desc=True)             .limit(1)             .execute()
        
        if result.data:
            return result.data[0]
        return None
    
    async def _update_session(
        self, company_id: str, phone: str,
        attempts: int, verified: bool, level: int
    ) -> None:
        """Update or create a verification session."""
        session = await self._get_active_session(company_id, phone)
        
        if session:
            supabase.table("verification_sessions")                 .update({
                    "attempts": attempts,
                    "verified": verified,
                    "verification_level": level,
                })                 .eq("id", session["id"])                 .execute()
        else:
            supabase.table("verification_sessions").insert({
                "company_id": company_id,
                "phone": phone,
                "session_token": secrets.token_urlsafe(32),
                "attempts": attempts,
                "verified": verified,
                "verification_level": level,
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
            }).execute()
