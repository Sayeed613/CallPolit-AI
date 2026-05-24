import json
import asyncio
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Optional

from services.supabase_client import supabase
from services.auth_middleware import get_current_user, get_optional_user
from services.scheduler import get_active_campaigns

logger = logging.getLogger(__name__)

router = APIRouter()

# WebSocket connections
_active_connections: set[WebSocket] = set()


@router.get("/calls")
async def get_live_calls(user_id: str = Depends(get_current_user)):
    """Get current active/live calls."""
    # Get active in-progress calls
    result = (
        supabase.table("call_logs")
        .select("*, campaigns!inner(company_id)")
        .eq("status", "in-progress")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {"calls": result.data, "active_count": len(result.data)}


@router.get("/stats")
async def get_live_stats(user_id: str = Depends(get_current_user)):
    """Get live dashboard statistics."""
    # Total today
    today = supabase.table("call_logs").select("id", count="exact")\
        .gte("created_at", "today")\
        .execute()

    connected_today = supabase.table("call_logs").select("id", count="exact")\
        .gte("created_at", "today")\
        .eq("status", "completed")\
        .execute()

    active_calls = supabase.table("call_logs").select("id", count="exact")\
        .eq("status", "in-progress")\
        .execute()

    active_campaigns = get_active_campaigns()

    return {
        "total_today": today.count if hasattr(today, "count") else 0,
        "connected_today": connected_today.count if hasattr(connected_today, "count") else 0,
        "active_calls": active_calls.count if hasattr(active_calls, "count") else 0,
        "active_campaigns": len(active_campaigns),
        "active_campaign_ids": active_campaigns,
    }


@router.websocket("/ws")
async def live_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time live call updates."""
    await websocket.accept()
    _active_connections.add(websocket)

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=10)
                # Handle ping or other messages
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        _active_connections.discard(websocket)


async def broadcast_call_update(call_data: dict):
    """Broadcast a call update to all connected WebSocket clients."""
    message = json.dumps({"type": "call_update", "data": call_data})
    dead_connections = set()
    for ws in _active_connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead_connections.add(ws)

    _active_connections.difference_update(dead_connections)


async def broadcast_event(event_type: str, data: dict):
    """Broadcast a generic event to all connected WebSocket clients."""
    message = json.dumps({"type": event_type, "data": data})
    dead_connections = set()
    for ws in _active_connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead_connections.add(ws)

    _active_connections.difference_update(dead_connections)
