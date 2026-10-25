import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StockIndicator } from './stock-indicator';
import { WithIntl } from './test-intl';

describe('StockIndicator', () => {
  it('announces stock changes politely (WCAG 4.1.3)', () => {
    render(
      <WithIntl>
        <StockIndicator stock={3} />
      </WithIntl>,
    );
    const region = screen.getByTestId('stock-indicator');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Only 3 left');
  });

  it('shows out of stock at zero', () => {
    render(
      <WithIntl>
        <StockIndicator stock={0} />
      </WithIntl>,
    );
    expect(screen.getByTestId('stock-indicator')).toHaveTextContent('Out of stock');
  });
});
