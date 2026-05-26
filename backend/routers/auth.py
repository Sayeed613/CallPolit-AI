import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    company_name: str
    industry: str = ""


@router.post("/signup")
async def signup(data: SignupRequest):
    """Create a user (auto-confirmed) + their company in one call.

    Uses the Supabase Admin API (service_role key) so the user is
    immediately active — no email confirmation needed.
    """
    try:
        # 1. Create the user with email auto-confirmed
        user_result = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
            "user_metadata": {"full_name": data.name},
        })

        if not user_result.user:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user_id = user_result.user.id

        # 2. Create the company record
        company_result = supabase.table("companies").insert({
            "user_id": user_id,
            "name": data.company_name,
            "industry": data.industry,
        }).execute()

        if not company_result.data:
            # User was created but company failed — still return success
            # so the user can set up company later from the dashboard
            logger.warning(f"Company creation failed for user {user_id}, but user was created")

        # 3. Sign in the user to get a session token
        session_result = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })

        if not session_result.user or not session_result.session:
            # User was created but sign-in failed (shouldn't happen)
            # Return user info at least so they can login manually
            return {
                "user": {"id": user_id, "email": data.email},
                "session": None,
                "note": "Account created. Please sign in.",
            }

        return {
            "user": {
                "id": session_result.user.id,
                "email": session_result.user.email,
                "user_metadata": session_result.user.user_metadata,
            },
            "session": {
                "access_token": session_result.session.access_token,
                "refresh_token": session_result.session.refresh_token,
            },
            "company": company_result.data[0] if company_result.data else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
