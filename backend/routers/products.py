"""Products router — extract and cache product data."""

from fastapi import APIRouter, HTTPException
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from models.schemas import ProductExtractRequest, ProductOut, ProductScreenshotExtractRequest
from services.product_extractor import extract_product
from services.screenshot_extractor import extract_product_from_screenshots
from database.client import supabase

router = APIRouter()

PRODUCT_QUERY_PARAMS = {"colorId", "color", "colour", "colourWayId", "sku", "variant", "variantId", "size"}
STANDARD_SIZES = {"XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"}
PRODUCT_DB_COLUMNS = {
    "url",
    "domain",
    "product_name",
    "brand",
    "category",
    "description",
    "fabric",
    "fit_style",
    "available_sizes",
    "available_colors",
    "images",
    "size_chart",
    "raw_data",
}


def _canonical_product_url(url: str) -> str:
    """Keep product-defining params, drop trackers."""
    parts = urlsplit(url.strip())
    kept = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=False)
        if key in PRODUCT_QUERY_PARAMS
    ]
    fragment_match = None
    if parts.fragment:
        for key in PRODUCT_QUERY_PARAMS:
            prefix = f"{key}-"
            if parts.fragment.startswith(prefix):
                fragment_match = (key, parts.fragment[len(prefix):])
                break
    if fragment_match and fragment_match not in kept:
        kept.append(fragment_match)
    query = urlencode(kept)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, ""))


def _is_usable_cached_product(row: dict) -> bool:
    """Avoid serving old rows created from anti-bot shells or noisy regex."""
    sizes = row.get("available_sizes") or []
    has_alpha_size = any(str(size).upper() in STANDARD_SIZES for size in sizes)
    return bool(
        row.get("product_name")
        and row.get("category") != "clothing"
        and (has_alpha_size or row.get("images") or row.get("available_colors"))
    )


def _row_to_product(row: dict) -> ProductOut:
    raw_data = row.get("raw_data") or {}
    if isinstance(raw_data, dict):
        for key in ("model_info", "extraction_confidence", "missing_fields", "sources"):
            if key in raw_data and key not in row:
                row[key] = raw_data[key]
    return ProductOut(**row)


def _product_to_db_payload(product: ProductOut) -> dict:
    data = product.model_dump(exclude_none=True, mode="json")
    metadata = {
        "model_info": data.pop("model_info", {}),
        "extraction_confidence": data.pop("extraction_confidence", 0.0),
        "missing_fields": data.pop("missing_fields", []),
        "sources": data.pop("sources", []),
    }
    data["raw_data"] = {**(data.get("raw_data") or {}), **metadata}
    return {key: value for key, value in data.items() if key in PRODUCT_DB_COLUMNS}


@router.post("/extract", response_model=ProductOut)
async def extract(req: ProductExtractRequest):
    """
    POST /api/products/extract
    Body: { "url": "https://store.com/product/...", "force_refresh": false }

    1. Check cache (products table) — return immediately if fresh (< 24h)
    2. Otherwise scrape the URL and cache the result
    """
    url = _canonical_product_url(req.url)

    # Check cache
    if not req.force_refresh:
        cached = (
            supabase
            .table("products")
            .select("*")
            .eq("url", url)
            .maybe_single()
            .execute()
        )
        if cached and cached.data and _is_usable_cached_product(cached.data):
            return _row_to_product(cached.data)

    # Scrape
    product = await extract_product(url)

    # Persist to cache
    payload = _product_to_db_payload(product)
    # Supabase expects JSON serialisable types; lists/dicts are fine
    upsert_res = (
        supabase
        .table("products")
        .upsert(payload, on_conflict="url")
        .execute()
    )
    if upsert_res.data:
        product.id = upsert_res.data[0].get("id")

    return product


@router.post("/extract/screenshots", response_model=ProductOut)
async def extract_from_screenshots(req: ProductScreenshotExtractRequest):
    """
    POST /api/products/extract/screenshots
    Body: { "images_base64": ["..."], "existing_product": optional ProductOut }

    Used when URL extraction is blocked or missing critical details such as a
    size chart. Screenshots are analyzed by a configured vision model.
    """
    try:
        return await extract_product_from_screenshots(req.images_base64, req.existing_product)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not extract screenshot data: {exc}") from exc


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    """Fetch a cached product by ID."""
    res = (
        supabase
        .table("products")
        .select("*")
        .eq("id", product_id)
        .maybe_single()
        .execute()
    )
    if not res or not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return _row_to_product(res.data)
