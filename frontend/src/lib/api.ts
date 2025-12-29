import type { LinksResponse, Stats } from "@/types";

const API_BASE: string = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("access_token");
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();

  // Try to parse JSON, but fall back to raw text if parsing fails
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch (e) {
    data = text;
  }

  if (res.ok) {
    // Return parsed data or an empty object for 204/empty responses
    return (data !== undefined ? (data as T) : ({} as T));
  }

  const msg = (typeof data === 'string' && data.trim()) ? data : res.statusText || "Request failed";
  const err = new Error(msg) as Error & { status?: number; data?: unknown };
  err.status = res.status;
  err.data = data;
  throw err;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await handleResponse<TokenResponse>(res);
  if (data && data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function getLinks(params: Record<string, unknown> = {}): Promise<LinksResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const res = await fetch(`${API_BASE}/api/links?${qs.toString()}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<LinksResponse>(res);
}

export async function getTags(): Promise<{ tags: string[] }> {
  const res = await fetch(`${API_BASE}/api/tags`, { headers: { ...authHeaders() } });
  return handleResponse<{ tags: string[] }>(res);
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`, { headers: { ...authHeaders() } });
  return handleResponse<Stats>(res);
}

export async function updateLink(id: string, data: Record<string, unknown>): Promise<{ status: string; id?: string }> {
  const res = await fetch(`${API_BASE}/api/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; id?: string }>(res);
}

export async function deleteLink(id: string): Promise<{ status: string; id?: string }> {
  const res = await fetch(`${API_BASE}/api/links/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<{ status: string; id?: string }>(res);
}
