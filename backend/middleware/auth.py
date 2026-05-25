from typing import Optional

from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.supabase_client import supabase

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
):
    if authorization and authorization.startswith("ApiKey "):
        api_key = authorization[7:].strip()
        result = (
            supabase.table("companies")
            .select("user_id")
            .eq("api_key", api_key)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["user_id"]
        raise HTTPException(status_code=401, detail="Invalid API key")

    token = None
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    try:
        return await get_current_user(credentials, authorization)
    except HTTPException:
        return None
