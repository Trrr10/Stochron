"""
Auth helper — validates Supabase JWT from request headers.

Every protected endpoint calls get_current_user() as a FastAPI dependency.
If the token is missing or invalid, it raises 401 immediately.
The user_id returned is the Supabase auth.users UUID —
used to scope all user_weights queries.
"""

from fastapi import Header, HTTPException, Depends
from core.supabase import supabase


async def get_current_user(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency. Extracts and validates the Bearer JWT.

    Usage in a router:
        @router.patch("/{id}/weight")
        def update(id: int, user_id: str = Depends(get_current_user)):
            ...

    Returns the user's UUID string (e.g. "550e8400-e29b-41d4-a716-446655440000")
    Raises 401 if token is missing, expired, or invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>"
        )

    token = authorization.replace("Bearer ", "").strip()

    try:
        # Validates the JWT against Supabase and returns user data
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return str(response.user.id)
    except Exception:
        raise HTTPException(status_code=401, detail="Token validation failed")