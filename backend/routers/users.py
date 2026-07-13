"""
Users router
────────────
Authenticated endpoints for reading and updating a user's saved measurements.
The Authorization header must carry the Supabase JWT.
"""

from fastapi import APIRouter, Header, HTTPException
from models.schemas import UserProfileOut, UserProfileUpdate
from services.user_service import get_profile, update_profile
from database.client import supabase

router = APIRouter()


def _get_user_id(authorization: str) -> str:
    """Validate Supabase JWT and return the user UUID."""
    token = authorization.replace("Bearer ", "").strip()
    try:
        res = supabase.auth.get_user(token)
        return res.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/me", response_model=UserProfileOut)
async def get_me(authorization: str = Header(...)):
    """
    GET /api/users/me
    Returns the authenticated user's saved measurements.
    If measurements_complete is false, the frontend should show the measurement form.
    """
    user_id = _get_user_id(authorization)
    profile = await get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/me", response_model=UserProfileOut)
async def update_me(body: UserProfileUpdate, authorization: str = Header(...)):
    """
    PATCH /api/users/me
    Save or update the user's measurements. Only sends provided fields.
    After saving, future try-on sessions will pre-fill from here.
    """
    user_id = _get_user_id(authorization)
    return await update_profile(user_id, body)
