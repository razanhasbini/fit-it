"""
Fit Engine Service
──────────────────
Core moat: calculates a real fit score by comparing user body measurements
against a garment's size chart — not just a visual overlay.

Logic:
  For each measurement present in both user data and size chart:
    - Calculate ease (garment dimension - body dimension)
    - Classify ease into fit zones (tight / slim / regular / relaxed / oversized)
    - Aggregate to an overall recommended size and fit score

Ease zones per measurement type:
  Chest/Bust:
    < 0 cm   → tight (warning)
    0–4 cm   → slim
    5–10 cm  → regular
    11–16 cm → relaxed
    > 16 cm  → oversized

  Waist:
    < 0 cm   → tight
    0–3 cm   → slim
    4–8 cm   → regular
    9–14 cm  → relaxed
    > 14 cm  → oversized

  Hips:
    < 0 cm   → tight
    0–4 cm   → slim
    5–10 cm  → regular
    11–16 cm → relaxed
    > 16 cm  → oversized

  Length/Inseam:
    ±2 cm    → perfect
    ±5 cm    → acceptable
    > 5 cm   → warning
"""

from models.schemas import BodyMeasurements, FitResult, FitWarning


# ── Ease classification ───────────────────────────────────────────────────────

FIT_ZONE_ORDER = ["tight", "slim", "regular", "relaxed", "oversized"]

EASE_ZONES: dict[str, list[tuple[float, str]]] = {
    # (max_ease, zone_name) — the last zone has no upper bound
    "chest":    [(-0.1, "tight"), (4, "slim"), (10, "regular"), (16, "relaxed"), (999, "oversized")],
    "bust":     [(-0.1, "tight"), (4, "slim"), (10, "regular"), (16, "relaxed"), (999, "oversized")],
    "waist":    [(-0.1, "tight"), (3, "slim"),  (8, "regular"), (14, "relaxed"), (999, "oversized")],
    "hips":     [(-0.1, "tight"), (4, "slim"), (10, "regular"), (16, "relaxed"), (999, "oversized")],
    "shoulder": [(-0.1, "tight"), (2, "slim"),  (4, "regular"),  (6, "relaxed"), (999, "oversized")],
    # Length/inseam: we care about absolute difference, not ease direction
    "length":   [(-5, "too_short"), (5, "ok"), (999, "too_long")],
    "inseam":   [(-5, "too_short"), (5, "ok"), (999, "too_long")],
}

FIT_ZONE_SCORE: dict[str, float] = {
    "tight":     0.3,
    "slim":      0.85,
    "regular":   1.0,
    "relaxed":   0.85,
    "oversized": 0.5,
    "too_short": 0.4,
    "ok":        1.0,
    "too_long":  0.5,
}

PREFERENCE_TARGET: dict[str, str] = {
    "slim":      "slim",
    "regular":   "regular",
    "relaxed":   "relaxed",
    "oversized": "oversized",
}


def _classify_ease(field: str, ease: float) -> str:
    zones = EASE_ZONES.get(field, EASE_ZONES["chest"])
    for max_ease, zone in zones:
        if ease <= max_ease:
            return zone
    return zones[-1][1]


# ── Measurement field mapping ─────────────────────────────────────────────────
# Maps size-chart keys → user measurement fields

SIZE_CHART_FIELD_MAP: dict[str, str] = {
    "chest":     "chest_cm",
    "bust":      "chest_cm",
    "waist":     "waist_cm",
    "hip":       "hips_cm",
    "hips":      "hips_cm",
    "shoulder":  "shoulder_width_cm",
    "inseam":    "inseam_cm",
    "length":    "inseam_cm",   # approximate
}


# ── Core fit calculation ──────────────────────────────────────────────────────

def calculate_fit(
    measurements: BodyMeasurements,
    size_chart: dict[str, dict[str, float]],   # {"S": {"chest": 96, ...}, "M": ...}
    available_sizes: list[str],
    fit_preference: str = "regular",
) -> FitResult:
    """
    Returns the best-fit size and a detailed fit breakdown.
    Works even if the size chart is partial (uses whatever fields are available).
    """
    user = measurements.model_dump()
    preference_target = PREFERENCE_TARGET.get(fit_preference, "regular")

    best_size = None
    best_score = -1.0
    best_details: dict[str, dict] = {}
    best_warnings: list[FitWarning] = []

    for size, chart_measurements in size_chart.items():
        if available_sizes and size not in available_sizes:
            continue

        size_score_parts = []
        size_details: dict[str, dict] = {}
        size_warnings: list[FitWarning] = []
        comparable_fields = 0

        for chart_field, chart_value in chart_measurements.items():
            user_field = SIZE_CHART_FIELD_MAP.get(chart_field.lower())
            if not user_field or user.get(user_field) is None:
                continue

            user_value = user[user_field]
            ease = chart_value - user_value
            zone = _classify_ease(chart_field.lower(), ease)
            score = FIT_ZONE_SCORE.get(zone, 0.5)

            # Boost score if zone matches preference
            if zone == preference_target:
                score = min(score + 0.1, 1.0)
            # Penalise tight (never preferred)
            if zone == "tight":
                size_warnings.append(FitWarning(
                    field=chart_field,
                    message=f"{chart_field.title()} may feel tight (ease: {ease:+.1f} cm)"
                ))

            if zone in ("too_short", "too_long"):
                size_warnings.append(FitWarning(
                    field=chart_field,
                    message=f"{chart_field.title()} may be {zone.replace('_', ' ')} by {abs(ease):.0f} cm"
                ))

            size_score_parts.append(score)
            size_details[chart_field] = {
                "user_value": user_value,
                "garment_value": chart_value,
                "ease": round(ease, 1),
                "zone": zone,
                "score": round(score, 3),
            }
            comparable_fields += 1

        if comparable_fields == 0:
            continue

        avg_score = sum(size_score_parts) / comparable_fields

        if avg_score > best_score:
            best_score = avg_score
            best_size = size
            best_details = size_details
            best_warnings = size_warnings

    # Fallback: if no size chart, use usual_size or first available size
    if best_size is None:
        best_size = measurements.usual_size or (available_sizes[0] if available_sizes else "M")
        best_score = 0.5

    # Determine overall fit type from details
    zones_used = [d["zone"] for d in best_details.values() if "zone" in d]
    fit_type = _most_common_zone(zones_used) if zones_used else preference_target

    return FitResult(
        recommended_size=best_size,
        fit_score=round(best_score, 3),
        fit_type=fit_type,
        warnings=best_warnings,
        details=best_details,
    )


def _most_common_zone(zones: list[str]) -> str:
    """Return the most frequently occurring fit zone."""
    if not zones:
        return "regular"
    valid = [z for z in zones if z in FIT_ZONE_ORDER]
    if not valid:
        return "regular"
    return max(set(valid), key=valid.count)


# ── BMI-based fallback when no size chart is available ────────────────────────

def estimate_size_from_body(height_cm: float, weight_kg: float, gender: str = "woman") -> str:
    """
    Very rough size estimate from height + weight alone.
    Used when no size chart is available.
    """
    if height_cm <= 0 or weight_kg <= 0:
        return "M"
    bmi = weight_kg / ((height_cm / 100) ** 2)

    if gender == "man":
        if bmi < 19:   return "XS"
        if bmi < 21.5: return "S"
        if bmi < 24:   return "M"
        if bmi < 27:   return "L"
        if bmi < 30:   return "XL"
        return "XXL"
    else:
        if bmi < 18:   return "XS"
        if bmi < 20.5: return "S"
        if bmi < 23:   return "M"
        if bmi < 26:   return "L"
        if bmi < 29:   return "XL"
        return "XXL"
