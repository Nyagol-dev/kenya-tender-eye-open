const API_URL = import.meta.env.VITE_API_URL ?? "/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Decode a JWT's payload WITHOUT verifying its signature.
 * Returns the `exp` claim (epoch seconds) or null if the token is malformed.
 * Used client-side only to schedule the silent-refresh timer.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → decode
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends HttpOnly cookies when present
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as Record<string, string>).message ??
      (body as Record<string, string>).error ??
      res.statusText;
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export interface GetTendersParams {
  q?: string;
  sector?: string;
  status?: string;
  min_value?: number;
  max_value?: number;
  page?: number;
  limit?: number;
}

export interface TenderListResponse {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getTenders(params: GetTendersParams = {}): Promise<TenderListResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  const url = queryString ? `/tenders?${queryString}` : '/tenders';
  return api.get<TenderListResponse>(url);
}

export async function getTenderById(id: string): Promise<any> {
  return api.get<any>(`/tenders/${id}`);
}
