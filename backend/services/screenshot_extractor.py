"""Screenshot-based product extraction fallback."""

import json
import os
import re

from models.schemas import ProductOut
from services.product_extractor import finalize_product


def _strip_data_url(value: str) -> str:
    return re.sub(r"^data:image/[a-zA-Z0-9.+-]+;base64,", "", value.strip())


def _merge_products(base: ProductOut | None, update: ProductOut) -> ProductOut:
    if not base:
        return update

    data = base.model_dump()
    update_data = update.model_dump(exclude_none=True)
    for key, value in update_data.items():
        if key in {"available_sizes", "available_colors", "images", "sources", "missing_fields"}:
            if value:
                existing = data.get(key) or []
                data[key] = existing + [item for item in value if item not in existing]
        elif key in {"size_chart", "model_info"}:
            if value:
                data[key] = {**(data.get(key) or {}), **value}
        elif value and not data.get(key):
            data[key] = value
    return ProductOut(**data)


async def extract_product_from_screenshots(
    images_base64: list[str],
    existing_product: ProductOut | None = None,
) -> ProductOut:
    """
    Analyze product screenshots with a configured vision model.

    Required env:
    - OPENAI_API_KEY
    - OPENAI_VISION_MODEL
    """
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_VISION_MODEL")
    if not api_key or not model:
        raise RuntimeError("OPENAI_API_KEY and OPENAI_VISION_MODEL are required for screenshot extraction")

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    image_items = [
        {
            "type": "input_image",
            "image_url": f"data:image/jpeg;base64,{_strip_data_url(image)}",
        }
        for image in images_base64
    ]

    response = await client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "Extract fashion product data from screenshots. "
                    "Normalize all languages into English/internal schema keys. "
                    "Return strict JSON only."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Extract product_name, brand, category, available_sizes, "
                            "available_colors, fabric, fit_style, size_chart, model_info. "
                            "Use normalized measurement keys: chest, bust, waist, hips, "
                            "shoulder, sleeve, length, inseam, rise, thigh, hem. "
                            "All garment measurements should be centimeters when possible. "
                            "Return JSON matching this schema: "
                            "{\"product_name\": string|null, \"brand\": string|null, "
                            "\"category\": string|null, \"available_sizes\": string[], "
                            "\"available_colors\": [{\"name\": string, \"hex\": string|null}], "
                            "\"fabric\": string|null, \"fit_style\": string|null, "
                            "\"size_chart\": {\"M\": {\"chest\": 96}}, "
                            "\"model_info\": {\"height_cm\": 188, \"wearing_size\": \"L\"}}"
                        ),
                    },
                    *image_items,
                ],
            },
        ],
    )

    text = response.output_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.IGNORECASE | re.MULTILINE).strip()
    parsed = json.loads(text)

    extracted = ProductOut(
        url=existing_product.url if existing_product else "screenshot://upload",
        domain=existing_product.domain if existing_product else None,
        product_name=parsed.get("product_name"),
        brand=parsed.get("brand"),
        category=parsed.get("category"),
        fabric=parsed.get("fabric"),
        fit_style=parsed.get("fit_style"),
        available_sizes=parsed.get("available_sizes") or [],
        available_colors=parsed.get("available_colors") or [],
        size_chart=parsed.get("size_chart") or {},
        model_info=parsed.get("model_info") or {},
        sources=["screenshot"],
    )
    return finalize_product(_merge_products(existing_product, extracted), "screenshot")
