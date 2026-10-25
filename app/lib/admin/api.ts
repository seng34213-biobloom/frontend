/**
 * Admin-side fetch helper. Every console request goes through `adminApi`, so
 * cookie credentials, the CSRF double-submit header and error mapping live
 * in one place. Mirrors the storefront client but lives in the admin app
 * since each Next.js workspace bundles its own client code.
 */

function trimSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Browser-reachable API origin (also used for links shown to the operator). */
export const API_BASE = trimSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000');

/**
 * Base URL for the current runtime. Server-side code inside Docker cannot
 * reach `localhost:4000`, so it prefers `API_INTERNAL_BASE_URL` (for example
 * http://api:4000) and falls back to the public URL.
 */
export function apiBase(): string {
  if (typeof window === 'undefined') {
    return trimSlash(process.env.API_INTERNAL_BASE_URL ?? API_BASE);
  }
  return API_BASE;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfFallback: string | null = null;

export async function ensureCsrf(): Promise<string> {
  const existing = readCookie('csrf-token');
  if (existing) return existing;
  if (csrfFallback) return csrfFallback;
  const res = await fetch(`${apiBase()}/api/auth/csrf`, { credentials: 'include' });
  const fresh = readCookie('csrf-token');
  if (fresh) return fresh;
  if (!res.ok) throw new ApiError(res.status, 'Could not prime CSRF token');
  const body = (await res.json()) as { csrfToken: string };
  // The cookie is scoped to the API host; when the console runs on another
  // host the token from the response body is echoed instead.
  csrfFallback = body.csrfToken;
  return body.csrfToken;
}

function messageFrom(payload: unknown, status: number): string {
  const message = (payload as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.length > 0) return message;
  if (status === 401) return 'Your session has expired. Sign in again.';
  if (status === 403) return 'Your account is not allowed to do this.';
  if (status === 429) return 'Too many attempts. Wait a few minutes and try again.';
  return `Request failed (${status})`;
}

export async function adminApi<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method, credentials: 'include', headers };
  if (method !== 'GET') headers['X-CSRF-Token'] = await ensureCsrf();
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${apiBase()}${path}`, init);
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }
  if (!res.ok) throw new ApiError(res.status, messageFrom(payload, res.status));
  return payload as T;
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : '';
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unexpected error';
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Accepts either a bare array or a `{ items }` page and returns the rows. */
export function rowsOf<T>(payload: T[] | Paginated<T> | null | undefined): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.items;
}

interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Product image upload: ask the API for a presigned URL, PUT the file
 * straight to object storage, then attach the stored URL to the product
 * (the API verifies size and magic bytes before saving the image row).
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  altText: string,
): Promise<{ id: string; url: string; altText: string }> {
  const presigned = await adminApi<PresignedUpload>('POST', '/api/uploads/product-image', {
    productId,
    contentType: file.type,
    sizeBytes: file.size,
  });
  const put = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) throw new ApiError(put.status, `Image upload failed (${put.status})`);
  return adminApi('POST', `/api/admin/products/${productId}/images`, {
    url: presigned.fileUrl,
    altText,
  });
}
