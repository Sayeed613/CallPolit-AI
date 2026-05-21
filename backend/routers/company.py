from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.supabase_client import supabase
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/company", tags=["company"])


class CreateCompanyRequest(BaseModel):
    name: str           # Company name
    industry: str = ""  # Optional
    mode: str           # "inbound" | "outbound" | "both"
    plan: str           # same as mode for now


@router.post("/create")
def create_company(
    req: CreateCompanyRequest,
    user_id: str = Depends(get_current_user),
):
    """Create a company. The authenticated user's ID is taken from the JWT."""
    # Validate mode
    valid_modes = ["inbound", "outbound", "both"]
    if req.mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"mode must be one of: {valid_modes}"
        )
    if req.plan not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"plan must be one of: {valid_modes}"
        )

    try:
        result = supabase.table("companies").insert({
            "user_id": user_id,
            "name": req.name,
            "industry": req.industry,
            "mode": req.mode,
            "plan": req.plan,
        }).execute()
        company = result.data[0]
        return {
            "success": True,
            "company_id": company["id"],
            "name": company["name"],
            "mode": company["mode"],
            "plan": company["plan"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def list_companies(
    user_id: str = Depends(get_current_user),
):
    """List all companies for the authenticated user."""
    result = supabase.table("companies").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"success": True, "companies": result.data}


@router.get("/get/{company_id}")
def get_company_details(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    """Frontend calls this to get company details after login.
    Verifies the authenticated user owns this company."""
    result = supabase.table("companies").select("*").eq("id", company_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Company not found")

    # Verify ownership
    if result.data.get("user_id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this company",
        )

    return result.data
