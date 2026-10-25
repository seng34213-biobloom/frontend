/**
 * Admin-side fetch helper. Mirrors the storefront client but lives in the
 * admin app since each Next.js workspace bundles its own client code.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrf(): Promise<string> {
  const existing = readCookie('csrf-token');
  if (existing) return existing;
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' });
  const fresh = readCookie('csrf-token');
  if (fresh) return fresh;
  if (!res.ok) throw new Error('Could not prime CSRF token');
  const body = (await res.json()) as { csrfToken: string };
  return body.csrfToken;
}

export async function adminApi<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (method !== 'GET') {
    (init.headers as Record<string, string>)['X-CSRF-Token'] = await ensureCsrf();
  }
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      (payload as { message?: string | string[] })?.message ?? `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return payload as T;
}
