'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@biobloom/ui';
import { InlineAlert } from '../../../components/inline-alert';
import { StockIndicator } from '../../../components/stock-indicator';
import { api, isApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { loginHref } from '../../../lib/navigation';

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
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!user) {
      router.push(loginHref(`/bundles/${slug}`));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await api('POST', '/api/cart/items', { bundleId, quantity: 1 });
      setMessage({ tone: 'success', text: t('added') });
    } catch (e) {
      if (isApiError(e, 401)) router.push(loginHref(`/bundles/${slug}`));
      else setMessage({ tone: 'error', text: (e as Error).message });
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
      <Button disabled={available <= 0 || busy} onClick={() => void add()}>
        {t('addToCart')}
      </Button>
    </div>
  );
}
