"""Global APScheduler singleton.

Created lazily on first use so the asyncio event loop is guaranteed
to be running when the scheduler starts.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """Return the global AsyncIOScheduler, creating it on first call."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        _scheduler.start()
    return _scheduler
