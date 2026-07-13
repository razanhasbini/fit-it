"""
Supabase client — shared across all services.
Uses the SERVICE ROLE key on the server side so we can bypass RLS
when needed (e.g. writing sessions for anonymous users).
All user-facing writes go through the anon key / JWT validation instead.
"""

import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

required_env = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY")
missing_env = [name for name in required_env if not os.getenv(name)]
if missing_env:
    missing = ", ".join(missing_env)
    raise RuntimeError(f"Missing backend environment variable(s): {missing}")

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_ANON_KEY: str = os.environ["SUPABASE_ANON_KEY"]

# Service-role client (server-side only, never expose to the browser)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_client(jwt: str) -> Client:
    """Return a Supabase client scoped to an authenticated user's JWT."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.auth.set_session(jwt, "")
    return client
