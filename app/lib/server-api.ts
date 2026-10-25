/**
 * Server Component fetch helper. Inside Docker the browser-facing API origin
 * (localhost:4000) is not reachable from the Next.js container, so server
 * fetches use `API_INTERNAL_BASE_URL` (e.g. http://api:4000) and fall back to
 * the public base URL for local `next dev`.
 */

export const API_INTERNAL = (
  process.env.API_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

/** The API could not be reached or answered with a server error. */
export class ApiUnavailableError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

/**
 * GET a public resource. Returns `null` on 404 so pages can call
 * `notFound()`; throws `ApiUnavailableError` otherwise so the route's
 * `error.tsx` renders a friendly error state. Always `no-store` so stock
 * figures are live.
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL}${path}`, { cache: 'no-store' });
  } catch (e) {
    throw new ApiUnavailableError((e as Error).message);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiUnavailableError(`API responded ${res.status}`, res.status);
  return (await res.json()) as T;
}

/** Like `serverGet`, but swallows failures — for optional homepage sections. */
export async function serverGetOptional<T>(path: string): Promise<T | null> {
  try {
    return await serverGet<T>(path);
  } catch {
    return null;
  }
}
