/**
 * FitAI API client — wraps the FastAPI backend endpoints.
 * All calls go to NEXT_PUBLIC_API_URL (http://localhost:8000 in dev).
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json();
}

// ── Types (mirroring backend Pydantic models) ─────────────────────────────────

export interface BodyMeasurements {
  height_cm?: number;
  weight_kg?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  shoulder_width_cm?: number;
  inseam_cm?: number;
  gender_category?: "woman" | "man" | "custom";
  usual_size?: string;
  fit_preference?: "slim" | "regular" | "relaxed" | "oversized";
}

export interface FitResult {
  recommended_size: string;
  fit_score: number;
  fit_type: string;
  warnings: { field: string; message: string }[];
  details: Record<string, unknown>;
}

export interface ProductOut {
  id?: string;
  url: string;
  domain?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  description?: string;
  available_sizes: string[];
  available_colors: { name: string; hex?: string }[];
  images: { url: string; type?: string }[];
  size_chart: Record<string, Record<string, number>>;
  fabric?: string;
  fit_style?: string;
  model_info: Record<string, string | number>;
  extraction_confidence: number;
  missing_fields: string[];
  sources: string[];
}

export interface SessionOut {
  id: string;
  status: "pending" | "extracting" | "fitting" | "rendering" | "done" | "error";
  product?: ProductOut;
  fit_result?: FitResult;
  result_image_url?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  height_cm?: number;
  weight_kg?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  shoulder_width_cm?: number;
  inseam_cm?: number;
  usual_size?: string;
  fit_preference?: string;
  gender_category?: string;
  measurements_complete: boolean;
}

// ── Product endpoints ────────────────────────────────────────────────────────

export async function extractProduct(
  url: string,
  forceRefresh = false
): Promise<ProductOut> {
  return apiFetch<ProductOut>("/api/products/extract", {
    method: "POST",
    body: JSON.stringify({ url, force_refresh: forceRefresh }),
  });
}

export async function extractProductFromScreenshots(
  imagesBase64: string[],
  existingProduct?: ProductOut
): Promise<ProductOut> {
  return apiFetch<ProductOut>("/api/products/extract/screenshots", {
    method: "POST",
    body: JSON.stringify({
      images_base64: imagesBase64,
      existing_product: existingProduct,
    }),
  });
}

// ── Session endpoints ─────────────────────────────────────────────────────────

export async function startSession(
  productUrl: string,
  measurements: BodyMeasurements,
  token?: string,
  sessionToken?: string
): Promise<SessionOut> {
  return apiFetch<SessionOut>(
    "/api/sessions/start",
    {
      method: "POST",
      body: JSON.stringify({
        product_url: productUrl,
        measurements,
        session_token: sessionToken,
      }),
    },
    token
  );
}

export async function pollSession(
  sessionId: string,
  token?: string,
  sessionToken?: string
): Promise<SessionOut> {
  const qs = sessionToken ? `?session_token=${sessionToken}` : "";
  return apiFetch<SessionOut>(`/api/sessions/${sessionId}${qs}`, {}, token);
}

export async function updateSessionSelection(
  sessionId: string,
  size?: string,
  color?: string,
  token?: string,
  sessionToken?: string
): Promise<void> {
  const qs = new URLSearchParams();
  if (size) qs.set("selected_size", size);
  if (color) qs.set("selected_color", color);
  if (sessionToken) qs.set("session_token", sessionToken);
  await apiFetch(
    `/api/sessions/${sessionId}?${qs.toString()}`,
    { method: "PATCH" },
    token
  );
}

// ── User profile endpoints ────────────────────────────────────────────────────

export async function getMyProfile(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", {}, token);
}

export async function updateMyProfile(
  token: string,
  data: Partial<BodyMeasurements> & { display_name?: string }
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  }, token);
}
