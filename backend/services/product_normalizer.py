"""Optional AI normalization for multilingual product facts."""

import json
import os
import re

from models.schemas import ProductOut


def _merge_product(base: ProductOut, update: dict) -> ProductOut:
    data = base.model_dump()
    for key in (
        "product_name",
        "brand",
        "category",
        "fabric",
        "fit_style",
        "description",
    ):
        if update.get(key) and not data.get(key):
            data[key] = update[key]

    for key in ("available_sizes", "available_colors"):
        if update.get(key):
            existing = data.get(key) or []
            data[key] = existing + [item for item in update[key] if item not in existing]

    if update.get("size_chart"):
        data["size_chart"] = {**(data.get("size_chart") or {}), **update["size_chart"]}
    if update.get("model_info"):
        data["model_info"] = {**(data.get("model_info") or {}), **update["model_info"]}

    return ProductOut(**data)


async def normalize_product_with_ai(product: ProductOut, source_text: str) -> ProductOut:
    """
    Normalize multilingual product text into the internal schema.

    This is optional. If OPENAI_API_KEY or OPENAI_NORMALIZATION_MODEL is absent,
    the existing rule-based extraction is returned unchanged.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_NORMALIZATION_MODEL")
    if not api_key or not model or not source_text.strip():
        return product

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    try:
        response = await client.responses.create(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "Normalize fashion product facts from any language into a strict JSON schema. "
                        "Use English/internal enum-like keys. Return JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Existing partial product JSON:\n"
                        f"{json.dumps(product.model_dump(mode='json'), ensure_ascii=False)}\n\n"
                        "Raw product text:\n"
                        f"{source_text[:12000]}\n\n"
                        "Return JSON with product_name, brand, category, available_sizes, "
                        "available_colors, fabric, fit_style, size_chart, model_info. "
                        "Normalize garment measurement keys to chest, bust, waist, hips, "
                        "shoulder, sleeve, length, inseam, rise, thigh, hem. "
                        "Measurements must be centimeters when possible."
                    ),
                },
            ],
        )
        text = response.output_text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.IGNORECASE | re.MULTILINE).strip()
        return _merge_product(product, json.loads(text))
    except Exception as exc:
        product.sources = list(dict.fromkeys([*product.sources, "ai_normalization_failed"]))
        product.missing_fields = list(dict.fromkeys([*product.missing_fields, "ai_normalization"]))
        print(f"AI normalization skipped: {exc.__class__.__name__}")
        return product
