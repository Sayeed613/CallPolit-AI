from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "CallPilot AI",
        "timestamp": datetime.utcnow().isoformat()
    }