"""
Pydantic models shared across the API.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID


# ── Products ──────────────────────────────────────────────────────────────────

class ColorOption(BaseModel):
    name: str
    hex: Optional[str] = None


class SizeChart(BaseModel):
    """Flexible: keys are size labels, values are measurement dicts."""
    pass  # handled as dict[str, dict[str, float]]


class ProductOut(BaseModel):
    id: Optional[UUID] = None
    url: str
    domain: Optional[str] = None
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    fabric: Optional[str] = None
    fit_style: Optional[str] = None
    available_sizes: list[str] = Field(default_factory=list)
    available_colors: list[dict] = Field(default_factory=list)
    images: list[dict] = Field(default_factory=list)
    size_chart: dict[str, dict[str, float]] = Field(default_factory=dict)
    model_info: dict[str, str | float] = Field(default_factory=dict)
    extraction_confidence: float = 0.0
    missing_fields: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)


class ProductExtractRequest(BaseModel):
    url: str
    force_refresh: bool = False

    @field_validator("url")
    @classmethod
    def must_be_http(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


# ── Body / Measurements ───────────────────────────────────────────────────────

class BodyMeasurements(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    shoulder_width_cm: Optional[float] = None
    inseam_cm: Optional[float] = None
    gender_category: Optional[str] = None   # 'woman' | 'man' | 'custom'
    usual_size: Optional[str] = None        # 'XS'|'S'|'M'|'L'|'XL'
    fit_preference: Optional[str] = None    # 'slim'|'regular'|'relaxed'|'oversized'


# ── Fit Engine ────────────────────────────────────────────────────────────────

class FitRequest(BaseModel):
    measurements: BodyMeasurements
    size_chart: dict[str, dict[str, float]]   # from product
    available_sizes: list[str] = Field(default_factory=list)
    category: Optional[str] = None


class FitWarning(BaseModel):
    field: str   # 'chest' | 'inseam' | 'shoulder'
    message: str


class FitResult(BaseModel):
    recommended_size: str
    fit_score: float            # 0.0 – 1.0
    fit_type: str               # 'tight'|'slim'|'regular'|'relaxed'|'oversized'
    warnings: list[FitWarning] = Field(default_factory=list)
    details: dict[str, dict] = Field(default_factory=dict)   # per-measurement breakdown


# ── Sessions ──────────────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    product_url: str
    session_token: Optional[str] = None     # anonymous identifier
    user_id: Optional[str] = None           # authenticated user UUID
    measurements: Optional[BodyMeasurements] = None

    @field_validator("product_url")
    @classmethod
    def product_url_must_be_http(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("Product URL must start with http:// or https://")
        return v


class ProductScreenshotExtractRequest(BaseModel):
    images_base64: list[str]
    existing_product: Optional[ProductOut] = None

    @field_validator("images_base64")
    @classmethod
    def must_include_images(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one screenshot is required")
        return v


class SessionOut(BaseModel):
    id: UUID
    status: str
    product: Optional[ProductOut] = None
    fit_result: Optional[FitResult] = None
    result_image_url: Optional[str] = None


# ── User Profile ──────────────────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    shoulder_width_cm: Optional[float] = None
    inseam_cm: Optional[float] = None
    usual_size: Optional[str] = None
    fit_preference: Optional[str] = None
    gender_category: Optional[str] = None


class UserProfileOut(BaseModel):
    id: str
    display_name: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    shoulder_width_cm: Optional[float] = None
    inseam_cm: Optional[float] = None
    usual_size: Optional[str] = None
    fit_preference: Optional[str] = None
    gender_category: Optional[str] = None
    measurements_complete: bool = False
