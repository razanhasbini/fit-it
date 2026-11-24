from models.schemas import BodyMeasurements
from services.fit_engine import _classify_ease, calculate_fit, estimate_size_from_body

CHART = {
    "S": {"chest": 92, "waist": 76},
    "M": {"chest": 98, "waist": 82},
    "L": {"chest": 104, "waist": 88},
}


def body(**kw):
    return BodyMeasurements(**{"chest_cm": 90, "waist_cm": 74, **kw})


def test_regular_preference_picks_size_with_regular_ease():
    result = calculate_fit(body(), CHART, ["S", "M", "L"], "regular")
    assert result.recommended_size == "M"  # chest +8, waist +8 -> regular
    assert result.fit_type == "regular"
    assert result.warnings == []


def test_slim_preference_can_pick_the_slim_size():
    # Regression: the preference boost used to cap at 0.95, so "regular" (1.0)
    # always won and a slim preference never changed the recommendation.
    result = calculate_fit(body(), CHART, ["S", "M", "L"], "slim")
    assert result.recommended_size == "S"
    assert result.fit_type == "slim"


def test_relaxed_preference_can_pick_the_relaxed_size():
    result = calculate_fit(body(), CHART, ["S", "M", "L"], "relaxed")
    assert result.recommended_size == "L"


def test_tight_size_produces_warning():
    result = calculate_fit(body(chest_cm=100, waist_cm=84), {"S": CHART["S"]}, ["S"])
    assert result.fit_type == "tight"
    assert {w.field for w in result.warnings} == {"chest", "waist"}


def test_unavailable_sizes_are_skipped():
    result = calculate_fit(body(), CHART, ["L"], "regular")
    assert result.recommended_size == "L"


def test_no_comparable_fields_falls_back_to_usual_size():
    result = calculate_fit(BodyMeasurements(usual_size="XL"), CHART, ["S", "M", "L"])
    assert result.recommended_size == "XL"
    assert result.fit_score == 0.5


def test_length_classification_is_absolute_tolerance():
    assert _classify_ease("inseam", -6) == "too_short"
    assert _classify_ease("inseam", 3) == "ok"
    assert _classify_ease("inseam", 7) == "too_long"


def test_bmi_estimate_handles_invalid_input():
    assert estimate_size_from_body(0, 60) == "M"
    assert estimate_size_from_body(170, 50) == "XS"
    assert estimate_size_from_body(180, 80, "man") == "L"  # BMI 24.7
