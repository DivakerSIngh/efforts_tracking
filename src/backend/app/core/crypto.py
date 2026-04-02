"""
Field-level encryption for sensitive financial data (HourlyRate, FixedAmount).
Encryption/decryption is done entirely in Python using Fernet symmetric encryption.
The database stores the ciphertext as NVARCHAR; no DB-side crypto functions are used.
"""
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


def _fernet() -> Fernet:
    return Fernet(settings.FIELD_ENCRYPTION_KEY.encode())


def encrypt_decimal(value: float | int | None) -> str:
    """Encrypt a numeric value to a Fernet token string for DB storage."""
    if value is None:
        return ""
    return _fernet().encrypt(str(float(value)).encode()).decode()


def decrypt_decimal(token: str | bytes | None) -> float:
    """Decrypt a Fernet-encrypted decimal value back to a float.

    Falls back to plain float conversion to handle legacy rows that contain
    unencrypted decimal strings (e.g. '50.0') written before encryption was enabled.
    """
    if not token:
        return 0.0
    raw = str(token).strip()
    if not raw:
        return 0.0
    try:
        return float(_fernet().decrypt(raw.encode()).decode())
    except (InvalidToken, Exception):
        # Legacy plain-text decimal stored before encryption was enabled
        try:
            return float(raw)
        except (ValueError, TypeError):
            return 0.0
