from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from app.auth.schemas import LoginRequest, TokenResponse, CurrentUserResponse, RefreshRequest, RefreshTokenResponse
from app.auth import service
from app.dependencies import get_current_user
from app.core.security import decode_refresh_token, create_access_token, create_refresh_token

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    """Authenticate and receive a JWT token."""
    return service.login(request)


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_token(body: RefreshRequest):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    try:
        payload = decode_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    new_payload = {
        "user_id": payload["user_id"],
        "email": payload["email"],
        "role": payload["role"],
        "full_name": payload["full_name"],
    }
    return RefreshTokenResponse(
        access_token=create_access_token(new_payload),
        refresh_token=create_refresh_token(new_payload),
    )


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user's info from the token (no DB call)."""
    return CurrentUserResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        role=current_user["role"],
        full_name=current_user["full_name"],
    )
