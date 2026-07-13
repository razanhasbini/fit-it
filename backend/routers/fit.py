"""Fit engine router."""

from fastapi import APIRouter
from models.schemas import FitRequest, FitResult
from services.fit_engine import calculate_fit

router = APIRouter()


@router.post("/calculate", response_model=FitResult)
async def calculate(req: FitRequest):
    """
    POST /api/fit/calculate
    Accepts user measurements + garment size chart, returns recommended size + fit score.
    No auth required — works for anonymous users too.
    """
    return calculate_fit(
        measurements=req.measurements,
        size_chart=req.size_chart,
        available_sizes=req.available_sizes,
        fit_preference=req.measurements.fit_preference or "regular",
    )
