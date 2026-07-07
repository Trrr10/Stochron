from typing import Optional
from fastapi import Header, HTTPException
from core.supabase import supabase


def _validate_token(token: str) -> str:
    """Shared validation logic. Raises 401 on any failure."""
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return str(response.user.id)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token validation failed")


async def get_current_user(authorization: str = Header(...)) -> str:
    """
    STRICT dependency. Use when a route must have a logged-in user.

    Usage:
        @router.patch("/{id}/weight")
        def update(id: int, user_id: str = Depends(get_current_user)):
            ...
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>"
        )
    token = authorization.replace("Bearer ", "").strip()
    return _validate_token(token)


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    OPTIONAL dependency. Use when a route should work for guests too.

    Usage:
        @router.get("")
        def get_dictionary(user_id: str | None = Depends(get_current_user_optional)):
            if user_id:
                ...  # personalize
            else:
                ...  # default/guest view
    """
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        # A malformed header was actively sent — still reject, don't silently
        # treat it as "no auth", or a typo'd token would look like guest mode.
        raise HTTPException(
            status_code=401,
            detail="Malformed Authorization header. Expected: Bearer <token>"
        )
    token = authorization.replace("Bearer ", "").strip()
    return _validate_token(token)