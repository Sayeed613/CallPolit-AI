"""Live call monitoring router for CallPilot AI.
Provides real-time call monitoring via REST and WebSocket.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from services.supabase_client import supabase, get_company
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/live", tags=["live"])

# ─── WebSocket Connection Manager ──────────────────────────────────────────────

class ConnectionManager:
    """Manages WebSocket connections for live call updates."""
    
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, company_id: str):
        await websocket.accept()
        if company_id not in self.active_connections:
            self.active_connections[company_id] = []
        self.active_connections[company_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, company_id: str):
        if company_id in self.active_connections:
            self.active_connections[company_id] = [
                ws for ws in self.active_connections[company_id]
                if ws != websocket
            ]
            if not self.active_connections[company_id]:
                del self.active_connections[company_id]
    
    async def broadcast(self, company_id: str, message: dict):
        """Broadcast a message to all connections for a company."""
        if company_id not in self.active_connections:
            return
        disconnected = []
        for connection in self.active_connections[company_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn, company_id)


manager = ConnectionManager()


# ─── Models ────────────────────────────────────────────────────────────────────

class CallStatusUpdate(BaseModel):
    call_sid: str
    status: str
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    verification_status: Optional[str] = None
    sentiment: Optional[str] = None
    transcript: Optional[list] = None
    ai_confidence: Optional[float] = None


# ─── REST Endpoints ────────────────────────────────────────────────────────────

@router.get("/calls/{company_id}")
async def get_active_calls(
    company_id: str,
    user: dict = Depends(get_current_user),
):
    """Get all currently active calls for a company."""
    try:
        result = supabase.table("call_logs") \
            .select("*") \
            .eq("company_id", company_id) \
            .eq("status", "in_progress") \
            .execute()
        
        active_calls = []
        for call in result.data or []:
            collected = call.get("collected_data", {}) or {}
            active_calls.append({
                "call_sid": call.get("twilio_call_sid", ""),
                "contact_id": call.get("contact_id"),
                "campaign_id": call.get("campaign_id"),
                "phone": _mask_phone(collected.get("customer_phone", "") or call.get("from_number", "")),
                "duration_seconds": call.get("duration_seconds", 0),
                "status": "in_progress",
                "verification_status": collected.get("verification_status", "none"),
                "language": collected.get("language", "hi-IN"),
                "sentiment": collected.get("sentiment", "neutral"),
                "started_at": call.get("created_at", ""),
            })
        
        return {"calls": active_calls, "count": len(active_calls)}
    except Exception as e:
        return {"calls": [], "count": 0, "error": str(e)}


@router.get("/call/{call_sid}")
async def get_call_details(
    call_sid: str,
    user: dict = Depends(get_current_user),
):
    """Get detailed information about a specific active call."""
    try:
        result = supabase.table("call_logs") \
            .select("*") \
            .eq("twilio_call_sid", call_sid) \
            .maybe_single() \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call = result.data
        collected = call.get("collected_data", {}) or {}
        transcript = call.get("transcript", []) or []
        
        return {
            "call_sid": call.get("twilio_call_sid"),
            "status": call.get("status"),
            "duration_seconds": call.get("duration_seconds", 0),
            "phone": _mask_phone(collected.get("customer_phone", "")),
            "language": collected.get("language", "hi-IN"),
            "verification_status": collected.get("verification_status", "none"),
            "verification_level": collected.get("verification_level", 1),
            "sentiment": collected.get("sentiment", "neutral"),
            "transcript": transcript[-10:] if transcript else [],  # Last 10 exchanges
            "follow_up_needed": call.get("needs_callback", False),
            "created_at": call.get("created_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intervene/{call_sid}")
async def intervene_call(
    call_sid: str,
    user: dict = Depends(get_current_user),
):
    """Human takeover of an active call.
    
    This marks the call for human intervention. The voice.py handler will
    detect this flag and transfer the call to the escalation phone number.
    """
    try:
        # Check call exists
        call = supabase.table("call_logs") \
            .select("*") \
            .eq("twilio_call_sid", call_sid) \
            .maybe_single() \
            .execute()
        
        if not call.data:
            raise HTTPException(status_code=404, detail="Call not found")
        
        collected = call.data.get("collected_data", {}) or {}
        collected["human_intervention"] = True
        collected["intervened_at"] = datetime.now(timezone.utc).isoformat()
        collected["intervened_by"] = user.get("email", "unknown")
        
        supabase.table("call_logs") \
            .update({"collected_data": collected}) \
            .eq("twilio_call_sid", call_sid) \
            .execute()
        
        # Broadcast intervention event via WebSocket
        await manager.broadcast(
            call.data.get("company_id", ""),
            {
                "type": "call_intervened",
                "call_sid": call_sid,
                "message": "Human agent has taken over the call",
            }
        )
        
        return {
            "message": "Intervention requested",
            "call_sid": call_sid,
            "status": "intervened",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────

@router.websocket("/ws/{company_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    company_id: str,
):
    """WebSocket for real-time call updates.
    
    Sends JSON messages:
    - call_started: { type, call_sid, phone, timestamp }
    - call_update: { type, call_sid, status, duration, transcript, verification, sentiment }
    - call_ended: { type, call_sid, duration, status }
    - call_intervened: { type, call_sid, message }
    """
    await manager.connect(websocket, company_id)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Client can send ping to keep alive
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, company_id)
    except Exception:
        manager.disconnect(websocket, company_id)


# ─── Helper Functions ─────────────────────────────────────────────────────────

def _mask_phone(phone: str) -> str:
    """Mask phone number: +91 98xxx xxx10"""
    if not phone:
        return ""
    cleaned = phone.replace("+", "").replace(" ", "").replace("-", "")
    if len(cleaned) >= 10:
        return cleaned[:3] + "xxx" + cleaned[-4:]
    return phone
