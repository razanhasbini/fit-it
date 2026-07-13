"""
FitAI — FastAPI Backend
Entry point. Mounts all routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import products, fit, users, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("FitAI API starting up...")
    yield
    # Shutdown
    print("FitAI API shutting down...")


app = FastAPI(
    title="FitAI API",
    description="AI-powered virtual try-on backend — product extraction, fit engine, user profiles.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        # Add your production domain here, e.g. "https://fitai.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(fit.router,      prefix="/api/fit",      tags=["Fit Engine"])
app.include_router(users.router,    prefix="/api/users",    tags=["Users"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fitai-api"}

