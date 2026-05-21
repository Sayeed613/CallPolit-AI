from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query

from services.supabase_client import (
    create_appointment,
    get_appointment,
    get_appointments_for_company,
    update_appointment_status,
    get_weekly_analytics,
    get_weekly_comparison,
    get_daily_trends,
    verify_company_ownership,
)
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api", tags=["appointments", "analytics"])


# ─── Appointment CRUD ───────────────────────────────────────────────────────────


@router.get("/appointments/{company_id}")
async def list_appointments(
    company_id: str,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    user_id: str = Depends(get_current_user),
):
    """List appointments for a company with optional date range filters.

    Protected — user must own this company.
    """
    verify_company_ownership(company_id, user_id)

    appointments = get_appointments_for_company(
        company_id, date_from=date_from, date_to=date_to, limit=limit
    )
    return {"success": True, "appointments": appointments, "count": len(appointments)}


@router.put("/appointments/{appointment_id}/status")
async def change_appointment_status(
    appointment_id: str,
    status: str = Query(..., description="New status: confirmed, cancelled, completed, no_show"),
    user_id: str = Depends(get_current_user),
):
    """Update an appointment's status.

    Verifies the user owns the company that owns this appointment.
    """
    appt = get_appointment(appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    verify_company_ownership(appt["company_id"], user_id)

    valid_statuses = {"scheduled", "confirmed", "completed", "cancelled", "no_show"}
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}",
        )

    ok = update_appointment_status(appointment_id, status)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update appointment status")

    return {"success": True, "appointment_id": appointment_id, "status": status}


# ─── Analytics Dashboard ────────────────────────────────────────────────────────


@router.get("/analytics/weekly/{company_id}")
async def weekly_report(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get this week's analytics report.

    Returns:
        calls_total, calls_connected, appointments_booked,
        avg_duration_seconds, connect_rate_pct, hours_saved
    """
    verify_company_ownership(company_id, user_id)

    stats = get_weekly_analytics(company_id)
    return {"success": True, "data": stats}


@router.get("/analytics/weekly/{company_id}/compare")
async def weekly_comparison(
    company_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get this week vs last week comparison.

    Returns:
        this_week: stats for current week
        last_week: stats for previous week
        changes: percentage change for each metric
    """
    verify_company_ownership(company_id, user_id)

    comparison = get_weekly_comparison(company_id)
    return {"success": True, "data": comparison}


@router.get("/analytics/trends/{company_id}")
async def daily_trends(
    company_id: str,
    days: int = Query(default=14, le=90, description="Number of days to look back"),
    user_id: str = Depends(get_current_user),
):
    """Get daily call and appointment trends for charts.

    Returns per-day breakdown:
        date, calls, connected, avg_duration, appointments
    """
    verify_company_ownership(company_id, user_id)

    trends = get_daily_trends(company_id, days=days)
    return {"success": True, "data": trends, "days": days}
