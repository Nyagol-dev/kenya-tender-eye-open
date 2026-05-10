import { config } from '../config/env';

const API_URL = config.apiUrl;

export function getAdminToken(): string | null {
  return sessionStorage.getItem('adminToken');
}

export function setAdminToken(token: string) {
  sessionStorage.setItem('adminToken', token);
}

export function clearAdminToken() {
  sessionStorage.removeItem('adminToken');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAdminToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle paths that might or might not start with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = cleanPath.startsWith('/admin') 
    ? cleanPath 
    : `/admin${cleanPath}`;

  const res = await fetch(`${API_URL}${fullPath}`, {
    ...options,
    headers,
    credentials: 'omit', // No cookies needed since we use sessionStorage token
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }

    const body = await res.json().catch(() => ({}));
    const msg =
      (body as Record<string, string>).message ??
      (body as Record<string, string>).error ??
      res.statusText;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
