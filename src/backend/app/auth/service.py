from fastapi import HTTPException, status
from app.auth.repository import get_user_for_auth
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.auth.schemas import LoginRequest, TokenResponse


def login(request: LoginRequest) -> TokenResponse:
    user = get_user_for_auth(request.email)

    # Use constant-time comparison path to avoid user enumeration
    if not user or not verify_password(request.password, user["PasswordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("IsActive"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    payload = {
        "user_id": user["UserId"],
        "email": user["Email"],
        "role": user["Role"],
        "full_name": user["FullName"],
    }
    token = create_access_token(payload)
    refresh = create_refresh_token(payload)

    return TokenResponse(
        access_token=token,
        refresh_token=refresh,
        role=user["Role"],
        user_id=user["UserId"],
        full_name=user["FullName"],
    )
