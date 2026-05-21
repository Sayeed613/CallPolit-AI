import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient, InvalidTokenError, ExpiredSignatureError, ImmatureSignatureError, decode
from config.settings import settings

logger = logging.getLogger("auth")

security = HTTPBearer()

# JWKS client with built-in caching
_jwks_client = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """FastAPI dependency — extracts and verifies the Supabase Auth JWT.

    Returns the authenticated user's UUID (``sub`` claim).
    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        # Get the signing key from JWKS (cached after first fetch)
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token.
        # Use a small leeway (30s) to tolerate clock skew between this server
        # and Supabase's auth servers when checking iat / exp claims.
        payload = decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            leeway=30,
            options={"verify_exp": True, "verify_aud": False},
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject claim",
            )
        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except ImmatureSignatureError:
        # Server clock is behind Supabase's — the iat claim is in the future
        logger.warning(
            "Clock skew detected: token's iat claim is in the future. "
            "Check system clock accuracy."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token not yet valid (clock skew). Retry or sync system clock.",
        )
    except InvalidTokenError as e:
        # Log the actual reason for debugging
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token",
        )
