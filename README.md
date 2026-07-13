# Fit It - AI Fashion Try-On Platform

Fit It is an AI fashion technology prototype for ultra-realistic virtual clothing try-on. Users paste a product URL from an online store, the backend extracts garment data, and the product flow will eventually combine body measurements, camera input, garment understanding, and fit prediction.

This repo contains:

- Next.js 15 landing/product UI
- FastAPI backend
- Supabase schema/client integration
- Product URL extraction pipeline
- Optional OpenAI text/vision normalization
- Screenshot extraction fallback scaffold

## Current Stack

Frontend:

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Framer Motion
- Lucide React
- Supabase JS client

Backend:

- FastAPI
- Python
- Supabase Python client
- httpx
- Playwright
- Optional OpenAI API

## Project Structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    HeroSection.tsx
    HowItWorks.tsx
    TechSection.tsx
    DemoSection.tsx
    EnterpriseSection.tsx
    SocialProof.tsx
    PricingSection.tsx
    FinalCTA.tsx
    Footer.tsx
  lib/
    api.ts
    supabase.ts

backend/
  main.py
  routers/
    products.py
    fit.py
    sessions.py
    users.py
  services/
    product_extractor.py
    product_normalizer.py
    screenshot_extractor.py
    fit_engine.py
    user_service.py
  models/
    schemas.py
  database/
    schema.sql
    client.py
```

## Environment Files

Do not commit real `.env` files. Use the examples:

- `.env.local.example`
- `backend/.env.example`

Frontend `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ENVIRONMENT=development
PORT=8000

# Optional AI extraction/normalization
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-4o
OPENAI_NORMALIZATION_MODEL=gpt-4o-mini
```

Important: ChatGPT billing and OpenAI API billing are separate. The OpenAI key must belong to a billed API project with quota.

## Frontend Setup

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```powershell
npm run build
npm run start
```

## Backend Setup

From repo root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Install Playwright browsers if needed:

```powershell
playwright install chromium
```

Run FastAPI:

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

Note: `/doc` is wrong. FastAPI Swagger is `/docs`.

## Supabase Setup

Run `backend/database/schema.sql` in the Supabase SQL editor. It creates:

- `user_profiles`
- `products`
- `tryon_sessions`
- `saved_looks`
- RLS policies
- helper triggers

The backend uses the service role key server-side for product/session writes. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

## Product Extraction Pipeline

The extractor is layered:

```text
URL
-> canonicalize product-defining params
-> fast httpx HTML fetch
-> reject anti-bot/interstitial shells
-> JSON-LD / Open Graph parsing
-> rendered browser extraction with Playwright
-> domain cleanup adapters
-> optional AI multilingual normalization
-> optional screenshot/vision fallback
-> confidence + missing-fields report
```

Current product response includes:

```json
{
  "product_name": "Example shirt",
  "brand": "Example brand",
  "category": "shirt",
  "available_sizes": ["XS", "S", "M", "L", "XL"],
  "available_colors": [{ "name": "Yellow" }],
  "images": [{ "url": "...", "type": "front" }],
  "size_chart": {
    "M": {
      "chest": 96,
      "length": 70,
      "shoulder": 45
    }
  },
  "model_info": {
    "height_cm": 177.5,
    "wearing_size": "S"
  },
  "extraction_confidence": 0.78,
  "missing_fields": ["size_chart"],
  "sources": ["browser_render"]
}
```

Size labels and garment measurements are different:

- `available_sizes`: labels such as `XS`, `S`, `M`, `L`
- `size_chart`: garment dimensions such as `chest`, `length`, `shoulder`, `sleeve`, `inseam`

Fit accuracy depends on `size_chart`, not labels alone.

## Known Extraction Behavior

Working test URLs used during development:

- Bershka: `https://www.bershka.com/es/camiseta-manga-corta-rib-contraste-c0p219636078.html?colorId=047`
- ASOS: `https://www.asos.com/abercrombie-fitch/abercrombie-fitch-ribbed-henley-cami-in-yellow-stripe/prd/210839548#colourWayId-210839550`

The ASOS URL fragment is canonicalized to `?colourWayId=...` because URL fragments are not sent to servers.

On Windows, Playwright rendering uses the sync Playwright API inside a worker thread. This avoids Uvicorn's Windows async subprocess `NotImplementedError`.

## API Endpoints

Products:

- `POST /api/products/extract`
- `POST /api/products/extract/screenshots`
- `GET /api/products/{product_id}`

Fit:

- `POST /api/fit/calculate`

Sessions:

- `POST /api/sessions/start`
- `GET /api/sessions/{session_id}`
- `PATCH /api/sessions/{session_id}`

Users:

- `GET /api/users/me`
- `PATCH /api/users/me`

## Manual Test: Product URL Extraction

In Swagger at `http://127.0.0.1:8000/docs`, call:

```text
POST /api/products/extract
```

Body:

```json
{
  "url": "https://www.asos.com/abercrombie-fitch/abercrombie-fitch-ribbed-henley-cami-in-yellow-stripe/prd/210839548#colourWayId-210839550",
  "force_refresh": true
}
```

## Manual Test: Screenshot Extraction

Screenshot extraction requires:

```env
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4o
```

PowerShell:

```powershell
$img = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\screenshot.jpg"))
$body = @{ images_base64 = @($img) } | ConvertTo-Json -Depth 20

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/products/extract/screenshots `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

## Debugging Guide

Status codes:

- `404`: server is running, but route does not exist
- `422`: request body/params do not match Pydantic schema
- `500`: backend Python exception
- browser cannot connect: server is not running or wrong port

For tracebacks, read from the bottom upward:

1. Final error type
2. First file under `backend/`
3. Route that triggered it

Common examples:

- `GET /doc 404`: use `/docs`
- `favicon.ico 404`: harmless browser icon request
- OpenAI `insufficient_quota`: API key/project has no usable API billing quota
- Playwright `NotImplementedError` on Windows: fixed by sync Playwright worker-thread renderer

## Current Next-Agent Priorities

1. Improve AI normalization parsing so `OPENAI_NORMALIZATION_MODEL` responses are validated and merged cleanly.
2. Improve generic color extraction for stores like ASOS.
3. Extract size charts from modal/table screenshots and merge into `size_chart`.
4. Add frontend upload UI for screenshot fallback when `missing_fields` includes `size_chart`.
5. Add tests around product canonicalization, cache fallback, and extractor confidence scoring.
6. Consider DB migration columns for `model_info`, `extraction_confidence`, `missing_fields`, and `sources` instead of storing them in `products.raw_data`.

## Verification Commands

```powershell
backend\venv\Scripts\python.exe -m py_compile backend\main.py backend\models\schemas.py backend\routers\products.py backend\services\product_extractor.py backend\services\product_normalizer.py backend\services\screenshot_extractor.py
npm run build
```

