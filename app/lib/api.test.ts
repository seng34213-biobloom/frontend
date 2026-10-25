import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, isApiError } from './api';

describe('api()', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    document.cookie = 'csrf-token=tok123';
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('sends the CSRF header and credentials on non-GET calls', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await api('POST', '/api/cart/items', { quantity: 1 });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('tok123');
  });

  it('does not send the CSRF header on GET', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await api('GET', '/api/orders');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBeUndefined();
  });

  it('maps an error response to ApiError with the API message', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 409, message: 'Only 2 units available' }), {
        status: 409,
      }),
    );
    const err = await api('PATCH', '/api/cart/items/x', { quantity: 9 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(isApiError(err, 409)).toBe(true);
    expect((err as Error).message).toBe('Only 2 units available');
  });
});
