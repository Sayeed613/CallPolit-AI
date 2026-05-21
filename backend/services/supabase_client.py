import json
import urllib.request
from datetime import datetime, timedelta
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
    """Get contacts that are pending and not already claimed by a campaign."""
    result = supabase.table("contacts") \
        .select("*") \
        .eq("company_id", company_id) \
        .eq("status", "pending") \
        .is_("campaign_id", "null") \
        .execute()
    return result.data


def update_contact_status(contact_id: str, status: str) -> None:
    supabase.table("contacts").update({"status": status}).eq("id", contact_id).execute()


def update_contact_retry(contact_id: str, retry_count: int, next_retry_at: str | None, status: str) -> None:
    """Update contact retry info and status."""
    update_data = {
        "retry_count": retry_count,
        "status": status,
        "last_retry_at": datetime.utcnow().isoformat(),
    }
    if next_retry_at is not None:
        update_data["next_retry_at"] = next_retry_at
    else:
        update_data["next_retry_at"] = None
    supabase.table("contacts").update(update_data).eq("id", contact_id).execute()


def mark_contact_invalid(contact_id: str, reason: str) -> None:
    """Mark contact as invalid with a reason (wrong_number, dnd, switched_off)."""
    supabase.table("contacts").update({
        "status": "invalid",
        "invalid_reason": reason,
    }).eq("id", contact_id).execute()


def update_contact_best_time(contact_id: str, call_time: str) -> None:
    """Store the best time to call this contact (learned from successful calls)."""
    supabase.table("contacts").update({
        "best_call_time": call_time,
    }).eq("id", contact_id).execute()


def get_retry_eligible_contacts(company_id: str) -> list[dict]:
    """Get contacts that are pending and due for a retry."""
    now_iso = datetime.utcnow().isoformat()
    result = supabase.table("contacts") \
        .select("*") \
        .eq("company_id", company_id) \
        .eq("status", "pending") \
        .lt("retry_count", 3) \
        .or_(f"next_retry_at.is.null,next_retry_at.lte.{now_iso}") \
        .order("next_retry_at", desc=False, nullsfirst=True) \
        .limit(50) \
        .execute()
    return result.data


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
        "unreachable": 0,
        "invalid_count": 0,
        "language": "hi-IN",
        "call_timing_start": "09:00",
        "call_timing_end": "18:00",
        "launched_at": datetime.utcnow().isoformat(),
    }).execute()
    return result.data[0]


def update_campaign_status(campaign_id: str, status: str) -> None:
    supabase.table("campaigns").update({"status": status}).eq("id", campaign_id).execute()


def increment_campaign_called(campaign_id: str) -> None:
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"called": (camp.get("called") or 0) + 1}).eq("id", campaign_id).execute()


def increment_campaign_connected(campaign_id: str) -> None:
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"connected": (camp.get("connected") or 0) + 1}).eq("id", campaign_id).execute()


def increment_campaign_unreachable(campaign_id: str) -> None:
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"unreachable": (camp.get("unreachable") or 0) + 1}).eq("id", campaign_id).execute()


def increment_campaign_invalid(campaign_id: str) -> None:
    camp = get_campaign(campaign_id)
    if camp:
        supabase.table("campaigns").update({"invalid_count": (camp.get("invalid_count") or 0) + 1}).eq("id", campaign_id).execute()


def get_campaign(campaign_id: str) -> dict | None:
    result = supabase.table("campaigns").select("*").eq("id", campaign_id).maybe_single().execute()
    return result.data


def get_campaign_stats(campaign_id: str) -> dict | None:
    """Get detailed campaign stats including avg duration."""
    camp = get_campaign(campaign_id)
    if not camp:
        return None

    # Calculate avg duration from call_logs
    try:
        duration_result = supabase.table("call_logs") \
            .select("duration_seconds") \
            .eq("campaign_id", campaign_id) \
            .eq("status", "completed") \
            .execute()
        durations = [r["duration_seconds"] for r in (duration_result.data or []) if r.get("duration_seconds")]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 0
    except Exception:
        avg_duration = 0

    return {
        "campaign_id": camp["id"],
        "campaign_name": camp.get("name", ""),
        "status": camp.get("status", ""),
        "total_contacts": camp.get("total_contacts", 0),
        "called": camp.get("called", 0),
        "connected": camp.get("connected", 0),
        "hot_leads": camp.get("hot_leads", 0),
        "unreachable": camp.get("unreachable", 0),
        "invalid_count": camp.get("invalid_count", 0),
        "avg_duration_seconds": avg_duration,
        "progress_pct": round(
            (camp.get("called", 0) / camp.get("total_contacts", 1)) * 100, 1
        ) if camp.get("total_contacts", 0) > 0 else 0,
        "connect_rate_pct": round(
            (camp.get("connected", 0) / camp.get("called", 1)) * 100, 1
        ) if camp.get("called", 0) > 0 else 0,
        "launched_at": camp.get("launched_at", ""),
        "completed_at": camp.get("completed_at"),
    }


def get_company_mode(company_id: str) -> str:
    """Returns the company mode: inbound, outbound, or both."""
    result = supabase.table("companies").select("mode").eq("id", company_id).maybe_single().execute()
    if result.data:
        return result.data.get("mode", "both")
    return "both"


def verify_company_ownership(company_id: str, user_id: str) -> dict:
    from fastapi import HTTPException
    try:
        result = supabase.table("companies").select("id,user_id").eq("id", company_id).maybe_single().execute()
        if result is None or result.data is None:
            raise HTTPException(status_code=404, detail="Company not found")
        if result.data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You do not have access to this company")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify ownership: {str(e)}")


# ─── Call Logs ───────────────────────────────────────────────────────────────────

def create_call_log(campaign_id: str | None, contact_id: str | None, twilio_call_sid: str, status: str = "initiated") -> dict:
    insert_data = {
        "twilio_call_sid": twilio_call_sid,
        "status": status,
        "duration_seconds": 0,
        "transcript": [],
        "collected_data": {},
        "whatsapp_followup_status": "none",
        "needs_callback": False,
        "retry_number": 0,
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


def mark_call_log_whatsapp_pending(twilio_call_sid: str) -> None:
    """Mark a call log as needing WhatsApp follow-up."""
    try:
        supabase.table("call_logs").update({
            "whatsapp_followup_status": "pending",
        }).eq("twilio_call_sid", twilio_call_sid).execute()
    except Exception:
        pass


def mark_call_log_callback(twilio_call_sid: str, follow_up_at: str | None = None) -> None:
    """Mark a call log as needing a callback."""
    update_data = {"needs_callback": True}
    if follow_up_at:
        update_data["follow_up_at"] = follow_up_at
    try:
        supabase.table("call_logs").update(update_data).eq("twilio_call_sid", twilio_call_sid).execute()
    except Exception:
        pass


# ─── Appointments ────────────────────────────────────────────────────────────────


def _rest_headers() -> dict:
    """Headers for raw REST API calls that bypass RLS with service role key."""
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table: str) -> str:
    return f"{settings.SUPABASE_URL}/rest/v1/{table}"


def create_appointment(
    company_id: str,
    customer_name: str,
    customer_phone: str,
    appointment_date: str,
    appointment_time: str,
    contact_id: str | None = None,
    call_log_id: str | None = None,
    notes: str | None = None,
) -> dict | None:
    """Create a new appointment. Uses raw REST API (supabase-py has a known quirk
    with service role key bypassing RLS on certain table operations).

    Returns the appointment dict or None on failure.
    """
    try:
        insert_data = {
            "company_id": company_id,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "status": "confirmed",
            "source": "voice_call",
        }
        if contact_id:
            insert_data["contact_id"] = contact_id
        if call_log_id:
            insert_data["call_log_id"] = call_log_id
        if notes:
            insert_data["notes"] = notes

        req = urllib.request.Request(
            _rest_url("appointments"),
            data=json.dumps(insert_data).encode(),
            headers=_rest_headers(),
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data[0] if data else None
    except Exception:
        return None


def get_appointment(appointment_id: str) -> dict | None:
    try:
        req = urllib.request.Request(
            f"{_rest_url('appointments')}?id=eq.{appointment_id}&select=*",
            headers=_rest_headers(),
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data[0] if data else None
    except Exception:
        return None


def get_appointments_for_company(
    company_id: str,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """Get appointments for a company with optional date range.

    Uses raw REST API (supabase-py has a known quirk with service role key
    bypassing RLS on certain table operations).
    """
    try:
        params = [
            f"company_id=eq.{company_id}",
            "select=*",
            f"order=appointment_date.desc,appointment_time.asc",
            f"limit={limit}",
        ]
        if date_from:
            params.append(f"appointment_date=gte.{date_from}")
        if date_to:
            params.append(f"appointment_date=lte.{date_to}")

        url = f"{_rest_url('appointments')}?{'&'.join(params)}"
        req = urllib.request.Request(url, headers=_rest_headers())
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return []


def update_appointment_status(appointment_id: str, status: str) -> bool:
    """Update appointment status. Uses raw REST API (supabase-py has a known quirk
    with service role key bypassing RLS on certain table operations).

    Returns True on success.
    """
    try:
        req = urllib.request.Request(
            f"{_rest_url('appointments')}?id=eq.{appointment_id}",
            data=json.dumps({"status": status}).encode(),
            headers={**_rest_headers(), "Prefer": "return=minimal"},
            method="PATCH",
        )
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


# ─── Analytics ───────────────────────────────────────────────────────────────────

def get_weekly_analytics(company_id: str) -> dict:
    """Get this week's analytics for a company.

    Returns:
        calls_total, calls_connected, appointments_booked,
        avg_duration_seconds, connect_rate_pct, hours_saved
    """
    now = datetime.utcnow()
    # Start of this week (Monday)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start_iso = week_start.isoformat()
    week_end_iso = now.isoformat()

    result = {
        "calls_total": 0,
        "calls_connected": 0,
        "appointments_booked": 0,
        "avg_duration_seconds": 0,
        "connect_rate_pct": 0,
        "hours_saved": 0,
    }

    try:
        # Call logs this week
        call_logs = supabase.table("call_logs") \
            .select("status, duration_seconds, created_at") \
            .gte("created_at", week_start_iso) \
            .lte("created_at", week_end_iso) \
            .execute()
        logs = call_logs.data or []
        result["calls_total"] = len(logs)
        result["calls_connected"] = sum(1 for l in logs if l.get("status") == "completed")

        durations = [l.get("duration_seconds", 0) or 0 for l in logs if l.get("duration_seconds")]
        result["avg_duration_seconds"] = round(sum(durations) / len(durations), 1) if durations else 0
        result["connect_rate_pct"] = round(
            (result["calls_connected"] / result["calls_total"] * 100), 1
        ) if result["calls_total"] > 0 else 0

        # Average human agent: ~1.5x longer per call + post-call work
        # Hours saved = total_call_minutes * 1.5 / 60
        total_call_minutes = sum(durations) / 60 if durations else 0
        result["hours_saved"] = round(total_call_minutes * 1.5 / 60, 1)

    except Exception:
        pass

    try:
        # Appointments this week (by created_at, not appointment_date)
        appts = supabase.table("appointments") \
            .select("id", count="exact") \
            .eq("company_id", company_id) \
            .gte("created_at", week_start_iso) \
            .lte("created_at", week_end_iso) \
            .execute()
        result["appointments_booked"] = appts.count if hasattr(appts, "count") else len(appts.data or [])
    except Exception:
        pass

    return result


def get_weekly_comparison(company_id: str) -> dict:
    """Get this week's analytics compared to last week."""
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    # Last week range
    last_week_end = week_start - timedelta(seconds=1)
    last_week_start = week_start - timedelta(days=7)

    this_week = get_weekly_analytics(company_id)

    # Temporarily shift time for "last week" calculation by querying manually
    last_week = {
        "calls_total": 0,
        "calls_connected": 0,
        "appointments_booked": 0,
        "avg_duration_seconds": 0,
        "connect_rate_pct": 0,
        "hours_saved": 0,
    }

    try:
        logs = supabase.table("call_logs") \
            .select("status, duration_seconds") \
            .gte("created_at", last_week_start.isoformat()) \
            .lte("created_at", last_week_end.isoformat()) \
            .execute()
        l = logs.data or []
        last_week["calls_total"] = len(l)
        last_week["calls_connected"] = sum(1 for x in l if x.get("status") == "completed")
        durs = [x.get("duration_seconds", 0) or 0 for x in l if x.get("duration_seconds")]
        last_week["avg_duration_seconds"] = round(sum(durs) / len(durs), 1) if durs else 0
        last_week["connect_rate_pct"] = round(
            (last_week["calls_connected"] / last_week["calls_total"] * 100), 1
        ) if last_week["calls_total"] > 0 else 0
        last_week["hours_saved"] = round((sum(durs) / 60 * 1.5 / 60), 1) if durs else 0
    except Exception:
        pass

    try:
        appts = supabase.table("appointments") \
            .select("id", count="exact") \
            .eq("company_id", company_id) \
            .gte("created_at", last_week_start.isoformat()) \
            .lte("created_at", last_week_end.isoformat()) \
            .execute()
        last_week["appointments_booked"] = appts.count if hasattr(appts, "count") else len(appts.data or [])
    except Exception:
        pass

    # Calculate percentage changes
    def pct_change(this, last):
        if last == 0:
            return 100 if this > 0 else 0
        return round(((this - last) / last) * 100, 1)

    return {
        "this_week": this_week,
        "last_week": last_week,
        "changes": {
            "calls_total": pct_change(this_week["calls_total"], last_week["calls_total"]),
            "calls_connected": pct_change(this_week["calls_connected"], last_week["calls_connected"]),
            "appointments_booked": pct_change(this_week["appointments_booked"], last_week["appointments_booked"]),
            "connect_rate_pct": round(this_week["connect_rate_pct"] - last_week["connect_rate_pct"], 1),
            "hours_saved": pct_change(this_week["hours_saved"], last_week["hours_saved"]),
        },
    }


def get_daily_trends(company_id: str, days: int = 14) -> list[dict]:
    """Get daily call and appointment counts for the last N days."""
    now = datetime.utcnow()
    start = now - timedelta(days=days)
    start_iso = start.isoformat()

    results = []
    try:
        # Get call logs grouped by day (approximate by fetching and grouping in Python)
        logs = supabase.table("call_logs") \
            .select("created_at, status, duration_seconds") \
            .gte("created_at", start_iso) \
            .lte("created_at", now.isoformat()) \
            .execute()

        # Group by date (first 10 chars of ISO = YYYY-MM-DD)
        daily = {}
        for log in logs.data or []:
            day = log.get("created_at", "")[:10]
            if day not in daily:
                daily[day] = {"date": day, "calls": 0, "connected": 0, "duration_sum": 0, "duration_count": 0}
            daily[day]["calls"] += 1
            if log.get("status") == "completed":
                daily[day]["connected"] += 1
            dur = log.get("duration_seconds", 0) or 0
            if dur:
                daily[day]["duration_sum"] += dur
                daily[day]["duration_count"] += 1

        # Add appointments per day
        try:
            appts = supabase.table("appointments") \
                .select("created_at") \
                .eq("company_id", company_id) \
                .gte("created_at", start_iso) \
                .execute()
            for appt in appts.data or []:
                day = appt.get("created_at", "")[:10]
                if day in daily:
                    daily[day]["appointments"] = daily[day].get("appointments", 0) + 1
                else:
                    daily[day] = {"date": day, "calls": 0, "connected": 0, "duration_sum": 0, "duration_count": 0, "appointments": 1}
        except Exception:
            pass

        # Convert to sorted list
        for day_data in daily.values():
            day_data["avg_duration"] = round(day_data["duration_sum"] / day_data["duration_count"], 1) if day_data["duration_count"] > 0 else 0
            day_data.pop("duration_sum", None)
            day_data.pop("duration_count", None)
            day_data["appointments"] = day_data.get("appointments", 0)
            results.append(day_data)

        results.sort(key=lambda x: x["date"])
    except Exception:
        pass

    return results
