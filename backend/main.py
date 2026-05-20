from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.health import router as health_router
from routers.documents import router as documents_router
from routers.contacts import router as contacts_router
from routers.campaign import router as campaign_router
from routers.voice import router as voice_router
from routers.company import router as company_router

app = FastAPI(
    title="CallPilot AI Backend",
    version="1.0.0",
    description="AI-powered inbound & outbound voice support platform for Indian businesses",
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(documents_router)
app.include_router(contacts_router)
app.include_router(campaign_router)
app.include_router(voice_router)
app.include_router(company_router)


@app.get("/")
async def root():
    return {"message": "CallPilot AI Backend Running"}
