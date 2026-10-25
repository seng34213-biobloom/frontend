/**
 * Sign-in redirects. `next` must stay a same-origin relative path so the
 * login page can never be used as an open redirect.
 */

const PLACEHOLDER_ORIGIN = 'http://storefront.invalid';

export function safeNextPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  // Backslashes and control characters are normalised to "/" by some browsers.
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
  if (url.pathname === '/login') return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(safeNextPath(next))}`;
}

/** Current path + query, for building `next` after a 401. */
export function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}
