/**
 * Browser-side helpers for hitting the NestJS API. CSRF + cookie handshake
 * applied automatically; callers just provide method, path, optional body.
 * Server Components use `lib/server-api.ts` instead (internal base URL).
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
);

export const CSRF_COOKIE = 'csrf-token';
export const CSRF_HEADER = 'X-CSRF-Token';
const LOCALE_COOKIE = 'NEXT_LOCALE';

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrf(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;
  const res = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' });
  const fresh = readCookie(CSRF_COOKIE);
  if (fresh) return fresh;
  if (!res.ok) throw new ApiError(res.status, 'Could not prime CSRF token');
  const body = (await res.json()) as { csrfToken: string };
  return body.csrfToken;
}

/**
 * Error raised for every non-2xx response. `status` is 0 when the request
 * never reached the API (offline, CORS, DNS).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(e: unknown, status?: number): e is ApiError {
  return e instanceof ApiError && (status === undefined || e.status === status);
}

function parsePayload(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFrom(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message) return message;
  }
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  return `Request failed (${status})`;
}

export async function api<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // The API localises its error messages from Accept-Language (en | si).
  const locale = readCookie(LOCALE_COOKIE);
  if (locale) headers['Accept-Language'] = locale;
  if (method !== 'GET') {
    headers[CSRF_HEADER] = await ensureCsrf();
  }
  const init: RequestInit = { method, credentials: 'include', headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (e) {
    throw new ApiError(0, (e as Error).message || 'Network error');
  }
  const payload = parsePayload(await res.text());
  if (!res.ok) {
    throw new ApiError(res.status, messageFrom(payload, res.status));
  }
  return payload as T;
}
