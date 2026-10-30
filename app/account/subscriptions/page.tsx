'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { ButtonLink } from '../../components/button-link';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { InlineAlert } from '../../components/inline-alert';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import { ratePercent } from '../../lib/money';
import { actionsFor } from '../../lib/subscriptions';
import type { Subscription, SubscriptionAction } from '../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../lib/use-require-auth';

function SubscriptionCard({
  sub,
  onChanged,
  onCancel,
}: {
  sub: Subscription;
  onChanged: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
}) {
  const t = useTranslations('subscriptions');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(action: SubscriptionAction) {
    if (action === 'cancel') return onCancel(sub);
    setBusy(true);
    setError(null);
    try {
      onChanged(await api<Subscription>('PATCH', `/api/subscriptions/${sub.id}/${action}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const label: Record<SubscriptionAction, string> = {
    pause: t('actionPause'),
    resume: t('actionResume'),
    'skip-next': t('actionSkipNext'),
    cancel: t('actionCancel'),
  };

  return (
    <li className="space-y-3 border border-black p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-forest-800 font-serif text-xl">
            {sub.product ? (
              <Link href={`/products/${sub.product.slug}`} className="hover:underline">
                {sub.product.name}
              </Link>
            ) : null}
          </h2>
          <p className="text-forest-600 text-sm">
            {sub.quantity} × {sub.variant?.name} ({sub.variant?.size}) ·{' '}
            {t('frequencyDays', { days: sub.frequencyDays })}
          </p>
        </div>
        <span className="caps border border-black px-2 py-0.5 text-sm font-medium">
          {t(`statuses.${sub.status}`)}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
        <dt className="text-forest-500">{t('perDelivery')}</dt>
        <dd>LKR {(Number(sub.discountedUnitPrice ?? 0) * sub.quantity).toFixed(2)}</dd>
        <dt className="text-forest-500">{t('discountLabel')}</dt>
        <dd>{t('discountOff', { percent: ratePercent(sub.discountRate) })}</dd>
        {sub.status !== 'CANCELLED' ? (
          <>
            <dt className="text-forest-500">{t('nextCharge')}</dt>
            <dd>{new Date(sub.nextBillingDate).toLocaleDateString()}</dd>
          </>
        ) : (
          <>
            <dt className="text-forest-500">{t('cancelled')}</dt>
            <dd>{sub.cancelledAt ? new Date(sub.cancelledAt).toLocaleDateString() : ''}</dd>
          </>
        )}
        <dt className="text-forest-500">{t('paymentLabel')}</dt>
        <dd>{sub.paymentGateway === 'STRIPE' ? t('paymentViaCard') : t('paymentViaPayHere')}</dd>
      </dl>
      {error ? (
        <div role="alert">
          <InlineAlert>{error}</InlineAlert>
        </div>
      ) : null}
      {actionsFor(sub.status).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actionsFor(sub.status).map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === 'cancel' ? 'danger' : 'secondary'}
              disabled={busy}
              onClick={() => void act(a)}
            >
              {label[a]}
            </Button>
          ))}
        </div>
      ) : null}
    </li>
  );
}

/** My Subscriptions dashboard (SDS §6.4, DDP-#32). */
export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (!ready) return;
    api<Subscription[]>('GET', '/api/subscriptions').then(setSubs, (e) => {
      if (!onAuthError(e)) setError((e as Error).message);
    });
  }, [ready, onAuthError]);

  const replace = (next: Subscription) => {
    setSubs((prev) => prev?.map((s) => (s.id === next.id ? next : s)) ?? null);
    setAnnounce(t('updated'));
  };

  async function confirmCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      replace(await api<Subscription>('PATCH', `/api/subscriptions/${cancelling.id}/cancel`));
      setCancelling(null);
    } catch (e) {
      setError((e as Error).message);
      setCancelling(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow={t('badge')} title={t('heading')} lead={t('lead')} />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {!subs && !error ? <Spinner label={t('loading')} /> : null}
      {subs && subs.length === 0 ? (
        <div className="border border-black p-8 text-center">
          <p>{t('empty')}</p>
          <ButtonLink href="/products" className="mt-4">
            {t('browse')}
          </ButtonLink>
        </div>
      ) : null}
      {subs && subs.length > 0 ? (
        <ul className="space-y-4">
          {subs.map((s) => (
            <SubscriptionCard key={s.id} sub={s} onChanged={replace} onCancel={setCancelling} />
          ))}
        </ul>
      ) : null}
      <ConfirmDialog
        open={cancelling !== null}
        title={t('cancelTitle')}
        description={t('cancelConfirm')}
        confirmLabel={t('actionCancel')}
        cancelLabel={t('keep')}
        busy={busy}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
