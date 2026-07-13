"""
User Profile Service
────────────────────
Handles reading and saving user measurements from Supabase.
Authenticated users: full profile stored in user_profiles table.
Anonymous users:     measurements only live in the session (not persisted).
"""

from database.client import supabase
from models.schemas import UserProfileOut, UserProfileUpdate, BodyMeasurements


MEASUREMENT_FIELDS = [
    "height_cm", "weight_kg", "chest_cm", "waist_cm", "hips_cm",
    "shoulder_width_cm", "inseam_cm", "usual_size", "fit_preference", "gender_category",
]


async def get_profile(user_id: str) -> UserProfileOut | None:
    """Fetch a user's saved profile from Supabase."""
    res = (
        supabase
        .table("user_profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    if not res or not res.data:
        return None
    return _row_to_profile(res.data)


async def update_profile(user_id: str, update: UserProfileUpdate) -> UserProfileOut:
    """Upsert user measurements. Only non-None fields are written."""
    payload = {k: v for k, v in update.model_dump().items() if v is not None}
    payload["id"] = user_id
    res = (
        supabase
        .table("user_profiles")
        .upsert(payload, on_conflict="id")
        .execute()
    )
    if not res or not res.data:
        raise RuntimeError("Profile update did not return a row")
    return _row_to_profile(res.data[0])


async def get_measurements_for_session(user_id: str | None) -> BodyMeasurements:
    """
    If the user is authenticated, load saved measurements.
    Returns an empty BodyMeasurements if anonymous (the frontend will supply them).
    """
    if not user_id:
        return BodyMeasurements()
    profile = await get_profile(user_id)
    if not profile:
        return BodyMeasurements()
    return BodyMeasurements(
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        chest_cm=profile.chest_cm,
        waist_cm=profile.waist_cm,
        hips_cm=profile.hips_cm,
        shoulder_width_cm=profile.shoulder_width_cm,
        inseam_cm=profile.inseam_cm,
        usual_size=profile.usual_size,
        fit_preference=profile.fit_preference,
        gender_category=profile.gender_category,
    )


def _row_to_profile(row: dict) -> UserProfileOut:
    filled = [f for f in MEASUREMENT_FIELDS if row.get(f) is not None]
    core = {"height_cm", "weight_kg", "gender_category"}
    complete = core.issubset(set(filled))
    return UserProfileOut(
        **{k: row.get(k) for k in UserProfileOut.model_fields},
        measurements_complete=complete,
    )
