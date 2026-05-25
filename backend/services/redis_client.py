import json
from typing import Any

import redis.asyncio as aioredis

from config.settings import settings

_redis = None


async def get_redis():
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def set_call_state(call_sid: str, state: dict[str, Any], ttl: int = 3600):
    r = await get_redis()
    await r.setex(f"call:{call_sid}", ttl, json.dumps(state))


async def get_call_state(call_sid: str) -> dict[str, Any] | None:
    r = await get_redis()
    raw = await r.get(f"call:{call_sid}")
    return json.loads(raw) if raw else None


async def delete_call_state(call_sid: str):
    r = await get_redis()
    await r.delete(f"call:{call_sid}")


async def set_otp(contact_id: str, otp: str, ttl: int = 300):
    r = await get_redis()
    await r.setex(f"otp:{contact_id}", ttl, otp)


async def get_otp(contact_id: str) -> str | None:
    r = await get_redis()
    return await r.get(f"otp:{contact_id}")


async def delete_otp(contact_id: str):
    r = await get_redis()
    await r.delete(f"otp:{contact_id}")
