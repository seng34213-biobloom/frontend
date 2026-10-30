import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WithIntl } from '../../components/test-intl';
import { VariantPanel } from './variant-panel';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../../lib/auth-context', () => ({ useAuth: () => ({ user: null, loading: false }) }));

const variants = [
  { id: 'v1', sku: 'J-250', name: 'Jar', size: '250 g', price: '900.00', unitWeightG: 320 },
  { id: 'v2', sku: 'J-500', name: 'Jar', size: '500 g', price: '1600.00', unitWeightG: 600 },
];

function renderPanel(stock: Record<string, number>) {
  return render(
    <WithIntl>
      <VariantPanel
        productSlug="wild-honey"
        productName="Wild Honey"
        variants={variants}
        stockByVariant={stock}
        earliestExpiryByVariant={{ v1: null, v2: null }}
      />
    </WithIntl>,
  );
}

describe('VariantPanel', () => {
  it('updates the price and stock when another size is chosen', () => {
    renderPanel({ v1: 20, v2: 4 });
    fireEvent.click(screen.getByRole('button', { name: /500 g/ }));
    expect(screen.getByRole('button', { name: /500 g/ })).toHaveAttribute('aria-pressed', 'true');
    // Unit price and line subtotal both show the new price.
    expect(screen.getAllByText(/LKR 1600.00/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('stock-indicator')).toHaveTextContent('Only 4 left');
  });

  it('disables purchase buttons when every variant is out of stock', () => {
    renderPanel({ v1: 0, v2: 0 });
    expect(screen.getByRole('button', { name: /Add to cart/ })).toBeDisabled();
  });
});
