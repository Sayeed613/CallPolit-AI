import random
import re
from typing import Optional


def generate_otp(length: int = 4) -> str:
    """Generate a numeric OTP."""
    return str(random.randint(10 ** (length - 1), (10**length) - 1))


def normalize_phone(phone: str) -> str:
    """Normalize a phone number to international format."""
    phone = re.sub(r"[^\d+]", "", phone)
    if phone.startswith("+"):
        return phone
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    if len(phone) == 10:
        return f"+91{phone}"
    return phone


def verify_name(provided_name: str, stored_name: str) -> bool:
    """Basic name matching (case-insensitive, fuzzy)."""
    return provided_name.strip().lower() == stored_name.strip().lower()


def verify_phone(provided_phone: str, stored_phone: str) -> bool:
    """Phone number matching after normalization."""
    return normalize_phone(provided_phone) == normalize_phone(stored_phone)


def verify_dob(provided_dob: str, stored_dob: str) -> bool:
    """Date of birth matching."""
    return provided_dob.strip() == stored_dob.strip()


def verify_pan(provided_pan: str, stored_pan: str) -> bool:
    """PAN card number matching (case-insensitive)."""
    return provided_pan.strip().upper() == stored_pan.strip().upper()


def verify_aadhaar(provided_aadhaar: str, stored_aadhaar: str) -> bool:
    """Aadhaar number matching (digits only)."""
    p = re.sub(r"\D", "", provided_aadhaar)
    s = re.sub(r"\D", "", stored_aadhaar)
    return p == s


def verify_account_details(
    provided_account: str, stored_account: str, provided_ifsc: str, stored_ifsc: str
) -> bool:
    """Bank account details matching."""
    return provided_account.strip() == stored_account.strip() and provided_ifsc.strip().upper() == stored_ifsc.strip().upper()


def check_verification_level(
    contact: dict,
    provided_data: dict,
    level: int = 1,
) -> dict:
    """
    Check verification at the specified level.
    Level 1: name + phone
    Level 2: + OTP + DOB
    Level 3: + PAN + Aadhaar + account
    """
    result = {"verified": False, "level_checks": {}, "overall": False}

    # Level 1 - Basic
    name_ok = verify_name(
        provided_data.get("name", ""), contact.get("name", "")
    )
    phone_ok = verify_phone(
        provided_data.get("phone", ""), contact.get("phone", "")
    )
    result["level_checks"]["name"] = name_ok
    result["level_checks"]["phone"] = phone_ok

    if level == 1:
        result["verified"] = name_ok and phone_ok
        return result

    # Level 2 - Standard
    dob_ok = verify_dob(
        provided_data.get("dob", ""), contact.get("dob", "")
    )
    otp_ok = provided_data.get("otp_verified", False)
    result["level_checks"]["dob"] = dob_ok
    result["level_checks"]["otp"] = otp_ok

    if level == 2:
        result["verified"] = name_ok and phone_ok and dob_ok and otp_ok
        return result

    # Level 3 - Strict
    pan_ok = verify_pan(
        provided_data.get("pan", ""), contact.get("pan", "")
    )
    aadhaar_ok = verify_aadhaar(
        provided_data.get("aadhaar", ""), contact.get("aadhaar", "")
    )
    account_ok = verify_account_details(
        provided_data.get("account_number", ""),
        contact.get("account_number", ""),
        provided_data.get("ifsc", ""),
        contact.get("ifsc", ""),
    )
    result["level_checks"]["pan"] = pan_ok
    result["level_checks"]["aadhaar"] = aadhaar_ok
    result["level_checks"]["account"] = account_ok

    result["verified"] = name_ok and phone_ok and dob_ok and otp_ok and pan_ok and aadhaar_ok and account_ok
    return result
