from app.core.database import execute_sp


def get_user_for_auth(email: str) -> dict | None:
    """
    Calls AuthenticateUser stored procedure.
    Returns user record dict or None if not found.
    Expected SP output columns: UserId, Email, PasswordHash, Role, FullName, IsActive
    """
    results = execute_sp("AuthenticateUser", {"Email": email})
    return results[0] if results else None
