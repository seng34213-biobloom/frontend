import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BatchStatusBadge } from './BatchStatusBadge';

describe('BatchStatusBadge (SDS §6.6 colours)', () => {
  it.each([
    ['ACTIVE', 'Active'],
    ['EXPIRING_SOON', /Expiring/],
    ['EXPIRED', 'Expired'],
    ['DEPLETED', 'Depleted'],
  ] as const)('labels %s', (status, label) => {
    render(<BatchStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
