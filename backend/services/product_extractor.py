"""
Product extraction service.

The extractor is intentionally layered:
1. Fetch raw HTML quickly with httpx.
2. Reject anti-bot/interstitial shells instead of scraping noise.
3. Parse structured product metadata when available.
4. For JavaScript-heavy stores, render in an installed browser and read the
   visible product panel plus browser resource URLs.
5. Fall back to conservative text extraction only from trusted product text.
"""

import asyncio
import json
import re
from html import unescape
from typing import Optional
from urllib.parse import parse_qs, urlparse

import httpx

from models.schemas import ProductOut
from services.product_normalizer import normalize_product_with_ai


STANDARD_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"]
PRODUCT_MARKERS = ("TALLAS", "SIZES", "SIZE", "VER MEDIDAS", "ADD TO BAG", "ANADIR", "AÑADIR")
CHALLENGE_MARKERS = (
    "bm-verify",
    "interstitial/ic.html",
    "triggerInterstitialChallenge",
    "errors.edgesuite.net",
)
MEASUREMENT_ALIASES = {
    "chest": ("chest", "bust", "pecho", "poitrine", "brust", "gogus", "göğüs"),
    "waist": ("waist", "cintura", "taille", "bel", "vita"),
    "hips": ("hips", "hip", "cadera", "caderas", "hanches", "kalca", "kalça"),
    "shoulder": ("shoulder", "shoulders", "hombro", "hombros", "epaule", "épaule", "omuz"),
    "length": ("length", "long", "largo", "longueur", "uzunluk", "lunghezza"),
    "sleeve": ("sleeve", "manga", "manche", "kol"),
    "inseam": ("inseam", "entrepierna", "inside leg", "inner leg", "ic bacak", "iç bacak"),
    "rise": ("rise", "tiro", "hauteur taille"),
    "thigh": ("thigh", "muslo", "cuisse"),
    "hem": ("hem", "bajo", "ourlet"),
}


def _domain(url: str) -> str:
    return urlparse(url).netloc.lower().replace("www.", "")


def _is_challenge_html(html: str) -> bool:
    lowered = html.lower()
    return any(marker.lower() in lowered for marker in CHALLENGE_MARKERS)


def _has_product_signal(product: ProductOut) -> bool:
    return bool(
        product.product_name
        and (product.available_sizes or product.available_colors or product.images)
    )


def _needs_ai_normalization(product: ProductOut) -> bool:
    return bool(
        not product.category
        or product.category == "clothing"
        or not product.size_chart
        or not product.model_info
    )


def _dedupe_dicts(items: list[dict], key: str = "url") -> list[dict]:
    seen = set()
    out = []
    for item in items:
        value = item.get(key) or json.dumps(item, sort_keys=True)
        if value in seen:
            continue
        seen.add(value)
        out.append(item)
    return out


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def _normalize_measurement_label(label: str) -> Optional[str]:
    cleaned = _clean_text(label).lower()
    for normalized, aliases in MEASUREMENT_ALIASES.items():
        if any(alias in cleaned for alias in aliases):
            return normalized
    return None


def _parse_measurement_value(value: str) -> Optional[float]:
    match = re.search(r"(\d+(?:[,.]\d+)?)\s*(cm|centimeters?|centimetres?)?", value, re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def _extract_size_chart_from_text(text: str, sizes: list[str]) -> dict[str, dict[str, float]]:
    """
    Best-effort parser for visible size-chart text.

    This is a rule fallback, not the long-term multilingual solution. The main
    architecture still expects AI normalization when page language/layouts get
    complex, but this catches simple tables and OCR text cheaply.
    """
    if not sizes:
        return {}

    lines = [_clean_text(line) for line in text.splitlines() if _clean_text(line)]
    size_set = {size.upper() for size in sizes}
    chart = {size: {} for size in sizes}

    for idx, line in enumerate(lines):
        normalized = _normalize_measurement_label(line)
        if not normalized:
            continue

        values = [
            float(value.replace(",", "."))
            for value in re.findall(r"\b(\d{2,3}(?:[,.]\d+)?)\b", line)
        ]
        if len(values) >= len(sizes):
            for size, value in zip(sizes, values):
                chart[size][normalized] = value
            continue

        nearby = lines[idx + 1 : idx + 1 + len(sizes) * 2]
        found_pairs: list[tuple[str, float]] = []
        for candidate in nearby:
            parts = candidate.split()
            if len(parts) >= 2 and parts[0].upper() in size_set:
                value = _parse_measurement_value(" ".join(parts[1:]))
                if value is not None:
                    found_pairs.append((parts[0].upper(), value))
        for size, value in found_pairs:
            if size in chart:
                chart[size][normalized] = value

    return {size: measurements for size, measurements in chart.items() if measurements}


def _extract_model_info(text: str) -> dict[str, str | float]:
    info: dict[str, str | float] = {}
    height_match = re.search(r"(?:model[oa]?|modelo)[^\n:]*:?[^\n]*(\d{3}(?:[,.]\d+)?)\s*cm", text, re.IGNORECASE)
    if height_match:
        info["height_cm"] = float(height_match.group(1).replace(",", "."))
    size_match = re.search(r"(?:wearing|wears|lleva|talla)\s+(?:size\s+)?([A-Z0-9]{1,4})(?:\s|$|-)", text, re.IGNORECASE)
    if size_match:
        info["wearing_size"] = size_match.group(1).upper()
    return info


def finalize_product(product: ProductOut, source: str) -> ProductOut:
    sources = list(dict.fromkeys([*product.sources, source]))
    missing = []
    if not product.product_name:
        missing.append("product_name")
    if not product.category or product.category == "clothing":
        missing.append("category")
    if not product.available_sizes:
        missing.append("available_sizes")
    if not product.available_colors:
        missing.append("available_colors")
    if not product.images:
        missing.append("images")
    if not product.size_chart:
        missing.append("size_chart")

    score = 0.15
    score += 0.18 if product.product_name else 0
    score += 0.12 if product.category and product.category != "clothing" else 0
    score += 0.14 if product.available_sizes else 0
    score += 0.10 if product.available_colors else 0
    score += 0.13 if product.images else 0
    score += 0.22 if product.size_chart else 0
    score += 0.06 if product.model_info else 0

    product.sources = sources
    product.missing_fields = missing
    product.extraction_confidence = round(min(score, 0.99), 2)
    return product


def _parse_json_ld(html: str) -> Optional[dict]:
    """Extract the first schema.org Product from JSON-LD blocks."""
    pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
    for match in re.finditer(pattern, html, re.DOTALL | re.IGNORECASE):
        try:
            data = json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            continue

        candidates = data if isinstance(data, list) else [data]
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            graph = candidate.get("@graph")
            if isinstance(graph, list):
                candidates.extend(graph)
            product_type = candidate.get("@type")
            if product_type == "Product" or (
                isinstance(product_type, list) and "Product" in product_type
            ):
                return candidate
    return None


def _extract_standard_sizes(text: str) -> list[str]:
    """Extract alpha clothing sizes only; numeric sizes need trusted context."""
    found = []
    for size in STANDARD_SIZES:
        if re.search(rf"(?<![A-Z0-9]){re.escape(size)}(?![A-Z0-9])", text, re.IGNORECASE):
            found.append(size)
    return found


def _extract_sizes_from_product_lines(lines: list[str]) -> list[str]:
    """Read sizes from the product-size block, not from the whole page."""
    sizes: list[str] = []
    for idx, line in enumerate(lines):
        if line.upper() not in {"TALLAS", "SIZES", "SIZE"}:
            continue

        for candidate in lines[idx + 1 : idx + 12]:
            upper = candidate.upper()
            if upper.startswith(("MODELO:", "MODEL:", "AÑADIR", "ANADIR", "ADD ")):
                break
            if upper in STANDARD_SIZES and upper not in sizes:
                sizes.append(upper)
            elif re.fullmatch(r"(?:[2-5][0-9]|[0-9]{3})", upper) and upper not in sizes:
                sizes.append(upper)
        if sizes:
            break
    return sizes


def _selected_color_id(url: str) -> Optional[str]:
    values = parse_qs(urlparse(url).query).get("colorId")
    return values[0] if values else None


def _is_product_image_url(src: str, page_url: str) -> bool:
    lower = src.lower()
    domain = _domain(page_url)

    if any(token in lower for token in ("cookie", "logo", "gshopping", "deskw", "icon")):
        return False

    if domain == "bershka.com":
        color_id = _selected_color_id(page_url)
        if "static.bershka.net/assets/public/" not in lower:
            return False
        if color_id and color_id.lower() not in lower:
            return False
        return bool(re.search(r"/\d{8,}-(?:p|a\d|e\d|r\d|o\d)[a-z]?/", lower))

    if domain == "asos.com":
        return "images.asos-media.com/products/" in lower

    return any(token in lower for token in ("image", "photo", "media", "static", "cdn"))


def _extract_images_from_html(html: str, page_url: str) -> list[dict]:
    images: list[dict] = []

    og = re.findall(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.IGNORECASE,
    )
    for src in og:
        if _is_product_image_url(src, page_url):
            images.append({"url": unescape(src), "type": "front"})

    urls = re.findall(r"https?://[^\"'<> )]+", html)
    for src in urls:
        lower = src.lower()
        if not _is_product_image_url(src, page_url):
            continue
        if not any(ext in lower for ext in (".jpg", ".jpeg", ".png", ".webp", "imwidth")):
            continue
        images.append({"url": unescape(src), "type": "gallery"})

    return _dedupe_dicts(images)[:8]


async def _fetch_html(url: str, timeout: int = 12) -> Optional[str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.text
    except Exception:
        return None


def _build_product_from_json_ld(data: dict, url: str) -> ProductOut:
    domain = _domain(url)
    name = _clean_text(str(data.get("name") or ""))

    brand = ""
    if isinstance(data.get("brand"), dict):
        brand = _clean_text(str(data["brand"].get("name") or ""))
    elif isinstance(data.get("brand"), str):
        brand = _clean_text(data["brand"])

    offers = data.get("offers", [])
    if isinstance(offers, dict):
        offers = [offers]

    colors: list[dict] = []
    sizes: list[str] = []
    for offer in offers:
        if not isinstance(offer, dict):
            continue
        item = offer.get("itemOffered") if isinstance(offer.get("itemOffered"), dict) else {}
        color = offer.get("color") or item.get("color")
        if color:
            colors.append({"name": _clean_text(str(color))})
        size = offer.get("size") or item.get("size")
        if size:
            sizes.append(_clean_text(str(size)).upper())

    description = _clean_text(str(data.get("description") or ""))
    fabric = _infer_fabric(description)
    images = []
    image_data = data.get("image")
    if isinstance(image_data, str):
        images.append({"url": image_data, "type": "front"})
    elif isinstance(image_data, list):
        images.extend({"url": src, "type": "gallery"} for src in image_data if isinstance(src, str))

    return ProductOut(
        url=url,
        domain=domain,
        product_name=name or None,
        brand=brand or None,
        category=_infer_category(f"{name} {description}"),
        description=description or None,
        fabric=fabric,
        fit_style=_infer_fit_style(f"{name} {description}"),
        available_sizes=list(dict.fromkeys(sizes)),
        available_colors=_dedupe_dicts(colors, key="name"),
        images=_dedupe_dicts(images)[:8],
    )


def _infer_category(text: str) -> str:
    text = text.lower()
    cats = {
        "dress": ["dress", "gown", "frock", "vestido"],
        "pants": ["pant", "trouser", "jeans", "denim", "chino", "shorts", "pantalon", "pantalón", "bermuda"],
        "shirt": ["shirt", "blouse", "top", "tee", "t-shirt", "cami", "camisole", "camiseta", "camisa", "polo"],
        "hoodie": ["hoodie", "sweatshirt", "pullover", "sudadera"],
        "jacket": ["jacket", "coat", "blazer", "parka", "puffer", "cazadora", "chaqueta", "abrigo"],
        "skirt": ["skirt", "falda"],
        "shoes": ["shoe", "sneaker", "boot", "heel", "sandal", "loafer", "zapato", "bota"],
    }
    for category, keywords in cats.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "clothing"


def _infer_fit_style(text: str) -> Optional[str]:
    text = text.lower()
    if "oversize" in text or "oversized" in text:
        return "oversized"
    if "slim" in text:
        return "slim"
    if "regular" in text:
        return "regular"
    if "boxy" in text:
        return "boxy"
    return None


def _infer_fabric(text: str) -> Optional[str]:
    match = re.search(
        r"\b(cotton|polyester|wool|silk|linen|denim|leather|nylon|viscose|rayon|algodon|algodón|lino)\b",
        text,
        re.IGNORECASE,
    )
    return match.group(0).title() if match else None


async def _render_with_playwright(url: str) -> Optional[dict]:
    """Render JS-heavy product pages using installed local browser channels."""
    return await asyncio.to_thread(_render_with_playwright_sync, url)


def _render_with_playwright_sync(url: str) -> Optional[dict]:
    """
    Sync Playwright wrapper.

    Uvicorn can run with a Windows event loop that does not support async
    subprocess creation. Playwright's sync API in a worker thread avoids that
    Windows-specific NotImplementedError.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None

    with sync_playwright() as p:
        launchers = [
            lambda: p.chromium.launch(headless=True),
            lambda: p.chromium.launch(channel="chrome", headless=True),
            lambda: p.chromium.launch(channel="msedge", headless=True),
        ]
        browser = None
        for launch in launchers:
            try:
                browser = launch()
                break
            except Exception:
                continue
        if not browser:
            return None

        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 1200},
        )
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(6000)
            html = page.content()
            body_text = page.locator("body").inner_text(timeout=5000)
            for label in (
                "VER MEDIDAS",
                "SIZE GUIDE",
                "SIZE CHART",
                "GUIDE DES TAILLES",
                "TABLA DE TALLAS",
                "BEDEN TABLOSU",
            ):
                try:
                    locator = page.get_by_text(label, exact=True)
                    if locator.count():
                        locator.first.click(timeout=3000)
                        page.wait_for_timeout(1500)
                        modal_text = page.locator("body").inner_text(timeout=5000)
                        if modal_text and modal_text not in body_text:
                            body_text = f"{body_text}\n{modal_text}"
                        html = page.content()
                        break
                except Exception:
                    continue
            title = page.title()
            resources = page.evaluate(
                """() => performance.getEntriesByType('resource').map((entry) => entry.name)"""
            )
            return {
                "html": html,
                "text": body_text,
                "title": title,
                "resources": resources,
            }
        except Exception:
            return None
        finally:
            browser.close()


def _extract_from_rendered_text(url: str, text: str, title: str = "") -> ProductOut:
    lines = [_clean_text(line) for line in text.splitlines() if _clean_text(line)]
    domain = _domain(url)

    price_idx = next(
        (idx for idx, line in enumerate(lines) if re.search(r"\d+(?:[,.]\d{2})?\s*(?:€|EUR|\$|£)", line)),
        None,
    )
    product_name = None
    if price_idx is not None:
        for candidate in reversed(lines[max(0, price_idx - 6) : price_idx]):
            upper = candidate.upper()
            if upper in {"MUJER", "HOMBRE", "WOMAN", "MAN", "COLOR"}:
                continue
            if len(candidate) > 4:
                product_name = candidate
                break

    if not product_name and title:
        product_name = _clean_text(re.split(r"\s[-|]\s", title)[0])

    color = None
    for idx, line in enumerate(lines):
        if line.upper() in {"COLOR", "COLOUR"} and idx + 1 < len(lines):
            color = lines[idx + 1]
            break
    if not color:
        ref_match = re.search(r"\bREF\.\s*([^\n]+)", text, re.IGNORECASE)
        if ref_match:
            color = ref_match.group(1).strip()

    sizes = _extract_sizes_from_product_lines(lines)
    if not sizes and any(marker in text.upper() for marker in PRODUCT_MARKERS):
        sizes = _extract_standard_sizes(text)

    description_parts = []
    model_match = re.search(r"(Modelo|Model):\s*([^\n]+)", text, re.IGNORECASE)
    if model_match:
        description_parts.append(f"{model_match.group(1)}: {_clean_text(model_match.group(2))}")
    model_info = _extract_model_info(text)

    brand = "Bershka" if "bershka.com" in domain else None
    colors = [{"name": color}] if color else []

    return ProductOut(
        url=url,
        domain=domain,
        product_name=product_name,
        brand=brand,
        category=_infer_category(product_name or title or text[:500]),
        description=" ".join(description_parts) or None,
        fabric=None,
        fit_style=_infer_fit_style(product_name or ""),
        available_sizes=sizes,
        available_colors=colors,
        size_chart=_extract_size_chart_from_text(text, sizes),
        model_info=model_info,
        images=[],
    )


def _extract_from_rendered(url: str, rendered: dict) -> ProductOut:
    html = rendered.get("html") or ""
    text = rendered.get("text") or ""
    title = rendered.get("title") or ""
    product = _extract_from_rendered_text(url, text, title)

    images = _extract_images_from_html(html, url)
    for resource in rendered.get("resources") or []:
        lower = resource.lower()
        if (
            _is_product_image_url(resource, url)
            and any(ext in lower for ext in (".jpg", ".jpeg", ".png", ".webp", "imwidth"))
        ):
            images.append({"url": resource, "type": "gallery"})
    images = _dedupe_dicts(images)
    if _domain(url) == "bershka.com" and images:
        front = next((img["url"] for img in images if re.search(r"/(\d{8,})-p/", img["url"])), "")
        code_match = re.search(r"/(\d{8,})-p/", front)
        if code_match:
            product_code = code_match.group(1)
            images = [img for img in images if product_code in img.get("url", "")]
    product.images = images[:8]
    return product


def _extract_from_html(url: str, html: str) -> ProductOut:
    json_ld = _parse_json_ld(html)
    if json_ld:
        product = _build_product_from_json_ld(json_ld, url)
    else:
        product = ProductOut(url=url, domain=_domain(url))
        title_match = re.search(
            r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        if title_match:
            product.product_name = _clean_text(title_match.group(1))
        product.available_sizes = _extract_standard_sizes(html)
        product.category = _infer_category(product.product_name or "")

    if not product.images:
        product.images = _extract_images_from_html(html, url)
    return product


async def extract_product(url: str) -> ProductOut:
    """Extract structured product data from any clothing URL."""
    html = await _fetch_html(url)
    product = None

    if html and not _is_challenge_html(html):
        product = _extract_from_html(url, html)

    should_render = (
        not html
        or _is_challenge_html(html)
        or not product
        or not _has_product_signal(product)
        or _domain(url) in {"bershka.com"}
    )
    if should_render:
        rendered = await _render_with_playwright(url)
        if rendered and not _is_challenge_html(rendered.get("html") or ""):
            rendered_product = _extract_from_rendered(url, rendered)
            if _has_product_signal(rendered_product):
                product = rendered_product
            if product and _needs_ai_normalization(product):
                product = await normalize_product_with_ai(product, rendered.get("text") or "")

    source = "browser_render" if should_render and product else "url"
    return finalize_product(product or ProductOut(url=url, domain=_domain(url)), source)
