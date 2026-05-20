import io
import re
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException

from services.supabase_client import insert_contacts
from services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def normalize_phone(phone_raw: str) -> str | None:
    """Validate and normalize phone numbers to E.164 format.

    - Remove spaces, dashes, brackets
    - 10 digits starting with 6-9 → add +91 prefix
    - Already has +91 → keep
    - Otherwise → return None (invalid)
    """
    cleaned = re.sub(r"[\s\-\(\)\[\]\.]", "", phone_raw)

    # If it starts with +, keep it and validate
    if cleaned.startswith("+"):
        if re.match(r"^\+91[6-9]\d{9}$", cleaned):
            return cleaned
        return None

    # If it starts with 91 and 12 digits
    if re.match(r"^91[6-9]\d{9}$", cleaned):
        return f"+{cleaned}"

    # 10-digit Indian mobile starting with 6-9
    if re.match(r"^[6-9]\d{9}$", cleaned):
        return f"+91{cleaned}"

    return None


@router.post("/upload")
async def upload_contacts(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    user_id: str = Depends(get_current_user),
):
    """Parse CSV or Excel, validate phones, bulk insert contacts."""
    # Ownership check — user must own this company
    from services.supabase_client import verify_company_ownership
    verify_company_ownership(company_id, user_id)

    # Mode gate — only outbound and both plans can upload contacts
    from services.supabase_client import get_company_mode
    company_mode = get_company_mode(company_id)
    if company_mode == "inbound":
        raise HTTPException(
            status_code=403,
            detail="Contact upload is not available on the Inbound plan. Upgrade to Outbound or Both."
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Detect file type by extension
    ext = file.filename.lower().split(".")[-1]
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use .csv or .xlsx",
        )

    try:
        # Read file bytes
        contents = await file.read()

        # Parse with pandas
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse file: {str(e)}",
        )

    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]

    # Check for required columns
    if "phone" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain a 'phone' column (and optionally 'name', 'email')",
        )

    total_rows = len(df)
    valid_contacts = []
    invalid_count = 0

    for _, row in df.iterrows():
        phone_raw = str(row.get("phone", "")).strip()
        normalized = normalize_phone(phone_raw)

        if not normalized:
            invalid_count += 1
            continue

        contact = {
            "company_id": company_id,
            "phone": normalized,
            "name": "Unknown",
            "email": "",
            "city": "",
            "qualification": "",
            "custom_data": {},
            "status": "pending",
        }

        # Optional fields
        name_val = row.get("name")
        if name_val and str(name_val).strip():
            contact["name"] = str(name_val).strip()

        email_val = row.get("email")
        if email_val and str(email_val).strip():
            contact["email"] = str(email_val).strip()

        valid_contacts.append(contact)

    if not valid_contacts:
        raise HTTPException(
            status_code=400,
            detail="No valid contacts found. Ensure phone numbers are 10-digit Indian mobile numbers.",
        )

    # Bulk insert with all required fields
    try:
        insert_contacts(valid_contacts)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to insert contacts: {str(e)}",
        )

    return {
        "success": True,
        "imported": len(valid_contacts),
        "skipped": invalid_count,
        "total_rows": total_rows,
    }
