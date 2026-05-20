from datetime import datetime
from supabase import create_client, Client
from config.settings import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)


# ─── Companies ──────────────────────────────────────────────────────────────────

def get_company(company_id: str) -> dict | None:
    result = supabase.table("companies").select("*").eq("id", company_id).maybe_single().execute()
    return result.data


def get_company_by_phone(phone: str) -> dict | None:
    """Find the company that owns a given Twilio phone number."""
    result = supabase.table("companies").select("*").eq("twilio_phone", phone).maybe_single().execute()
    return result.data


# ─── Documents ───────────────────────────────────────────────────────────────────

def create_document(company_id: str, file_name: str, file_url: str) -> dict:
    result = supabase.table("documents").insert({
        "company_id": company_id,
        "file_name": file_name,
        "file_url": file_url,
        "status": "processing",
    }).execute()
    return result.data[0]


def update_document_status(document_id: str, status: str, extracted_text: str | None = None) -> None:
    update_data = {"status": status}
    if extracted_text is not None:
        update_data["extracted_text"] = extracted_text
    supabase.table("documents").update(update_data).eq("id", document_id).execute()


def get_document(document_id: str) -> dict | None:
    result = supabase.table("documents").select("*").eq("id", document_id).maybe_single().execute()
    return result.data


# ─── Document Chunks ─────────────────────────────────────────────────────────────

def insert_chunk(document_id: str, company_id: str, chunk_index: int, chunk_text: str, embedding: list[float]) -> dict:
    result = supabase.table("document_chunks").insert({
        "document_id": document_id,
        "company_id": company_id,
        "chunk_index": chunk_index,
        "chunk_text": chunk_text,
        "embedding": embedding,
    }).execute()
    return result.data[0]


def match_chunks(query_embedding: list[float], company_id: str, match_count: int = 5) -> list[dict]:
    """Call the Supabase RPC match_chunks for semantic search."""
    result = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "company_id_filter": company_id,
            "match_count": match_count,
        }
    ).execute()
    return result.data


# ─── Contacts ────────────────────────────────────────────────────────────────────

def insert_contacts(contacts: list[dict]) -> int:
    """Bulk insert contacts. Returns number inserted."""
    result = supabase.table("contacts").insert(contacts).execute()
    return len(result.data)


def get_pending_contacts(company_id: str) -> list[dict]:
    result = supabase.table("contacts") \
        .select("*") \
        .eq("company_id", company_id) \
        .eq("status", "pending") \
        .execute()
    return result.data


def update_contact_status(contact_id: str, status: str) -> None:
    supabase.table("contacts").update({"status": status}).eq("id", contact_id).execute()


# ─── Campaigns ───────────────────────────────────────────────────────────────────

def create_campaign(company_id: str, name: str, total_contacts: int) -> dict:
    result = supabase.table("campaigns").insert({
        "company_id": company_id,
        "name": name,
        "status": "running",
        "total_contacts": total_contacts,
        "called": 0,
        "connected": 0,
        "hot_leads": 0,
        "language": "hi-IN",
        "call_timing_start": "09:00",
        "call_timing_end": "18:00",
        "launched_at": datetime.utcnow().isoformat(),
    }).execute()
    return result.data[0]


def update_campaign_status(campaign_id: str, status: str) -> None:
    supabase.table("campaigns").update({"status": status}).eq("id", campaign_id).execute()


def increment_campaign_called(campaign_id: str) -> None:
    # Fetch current, increment, update back
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"called": (camp.get("called") or 0) + 1}).eq("id", campaign_id).execute()


def increment_campaign_connected(campaign_id: str) -> None:
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"connected": (camp.get("connected") or 0) + 1}).eq("id", campaign_id).execute()


def get_campaign(campaign_id: str) -> dict | None:
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).maybe_single().execute()
    return result.data


def get_company_mode(company_id: str) -> str:
    """Returns the company mode: inbound, outbound, or both."""
    result = supabase.table("companies").select("mode").eq("id", company_id).maybe_single().execute()
    if result.data:
        return result.data.get("mode", "both")
    return "both"  # default to both if not found


def verify_company_ownership(company_id: str, user_id: str) -> dict:
    """Verify that the authenticated user owns the given company.

    Returns the company record if owned.
    Raises HTTPException (404 or 403) if not found or not owned.
    """
    from fastapi import HTTPException
    result = supabase.table("companies").select("id,user_id").eq("id", company_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )
    if result.data.get("user_id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this company",
        )
    return result.data


# ─── Call Logs ───────────────────────────────────────────────────────────────────

def create_call_log(campaign_id: str | None, contact_id: str | None, twilio_call_sid: str, status: str = "initiated") -> dict:
    """Create a call log entry."""
    insert_data = {
        "twilio_call_sid": twilio_call_sid,
        "status": status,
        "duration_seconds": 0,
        "transcript": [],
        "collected_data": {},
    }
    if campaign_id:
        insert_data["campaign_id"] = campaign_id
    if contact_id:
        insert_data["contact_id"] = contact_id
    result = supabase.table("call_logs").insert(insert_data).execute()
    return result.data[0]


def update_call_log(twilio_call_sid: str, updates: dict) -> None:
    try:
        supabase.table("call_logs").update(updates).eq("twilio_call_sid", twilio_call_sid).execute()
    except Exception:
        pass


def get_call_log_by_sid(twilio_call_sid: str) -> dict | None:
    try:
        result = supabase.table("call_logs").select("*").eq("twilio_call_sid", twilio_call_sid).maybe_single().execute()
        return result.data if result else None
    except Exception:
        return None


def get_call_log(call_log_id: str) -> dict | None:
    result = supabase.table("call_logs").select("*").eq("id", call_log_id).maybe_single().execute()
    return result.data
