'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { buttonClass } from '../../components/button-styles';
import { InlineAlert } from '../../components/inline-alert';
import { StockIndicator } from '../../components/stock-indicator';
import { useCart } from '../../lib/cart-context';

export function AddBundleToCart({
  bundleId,
  slug,
  available,
}: {
  bundleId: string;
  slug: string;
  available: number;
}) {
  const t = useTranslations('bundles');
  const { addItem } = useCart();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const added = await addItem({ bundleId, quantity: 1 }, `/bundles/${slug}`);
      if (added) setMessage({ tone: 'success', text: t('added') });
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <StockIndicator stock={available} />
      {message ? (
        <div aria-live="polite">
          <InlineAlert tone={message.tone}>{message.text}</InlineAlert>
        </div>
      ) : null}
      <button
        type="button"
        className={buttonClass('primary', 'w-full')}
        disabled={available <= 0 || busy}
        onClick={() => void add()}
      >
        {t('addToCart')}
      </button>
    </div>
  );
}
