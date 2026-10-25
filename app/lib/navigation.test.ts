import { describe, expect, it } from 'vitest';
import { loginHref, safeNextPath } from './navigation';

describe('safeNextPath', () => {
  it('keeps same-site relative paths with their query', () => {
    expect(safeNextPath('/checkout?subscribe=1')).toBe('/checkout?subscribe=1');
  });

  it('rejects absolute, protocol-relative and backslash redirects', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath('/login')).toBe('/');
  });

  it('builds a login link carrying the encoded next path', () => {
    expect(loginHref('/cart')).toBe('/login?next=%2Fcart');
  });
});
