import os
import time
import json
import logging
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from routers import (
    health,
    company,
    contacts,
    documents,
    campaign,
    voice,
    verification,
    appointments,
    live,
    analytics,
)

load_dotenv()

# ─── Sentry ──────────────────────────────────────────────────────
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv("ENVIRONMENT", "development"),
)

# ─── Structured JSON Logging ─────────────────────────────────────
class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        })

logging.basicConfig(level=logging.INFO)
for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())

logger = logging.getLogger(__name__)

# ─── Rate Limiting ───────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── FastAPI App ─────────────────────────────────────────────────
app = FastAPI(title="CallPilot AI", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ─── Request Logging Middleware ──────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(
        f"{request.method} {request.url.path} {response.status_code} {duration:.3f}s"
    )
    return response

# ─── Root Health Check ───────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "CallPilot AI", "version": "1.0.0"}

# ─── Include Routers ─────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(company.router, prefix="/api/company", tags=["Company"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(campaign.router, prefix="/api/campaign", tags=["Campaigns"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(live.router, prefix="/api/live", tags=["Live"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
