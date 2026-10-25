'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { AddressForm } from '../../../components/address-form';
import { InlineAlert } from '../../../components/inline-alert';
import { PageHeader } from '../../../components/page-header';
import { api } from '../../lib/api';
import type { Address } from '../../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../../lib/use-require-auth';

export default function AddressesPage() {
  const t = useTranslations('address');
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setAddresses(await api<Address[]>('GET', '/api/addresses'));
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (ready) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function makeDefault(id: string) {
    try {
      await api('PATCH', `/api/addresses/${id}/default`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} />
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      {!addresses && !error ? <Spinner label={t('loading')} /> : null}
      {addresses ? (
        <ul className="space-y-3">
          {addresses.length === 0 ? <li>{t('none')}</li> : null}
          {addresses.map((a) => (
            <li
              key={a.id}
              className="border-cream-200 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"
            >
              <address className="text-sm not-italic">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.district} {a.postalCode}
              </address>
              {a.isDefault ? (
                <span className="bg-brand-100 text-brand-800 rounded-full px-3 py-1 text-xs font-semibold">
                  {t('default')}
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => void makeDefault(a.id)}>
                  {t('makeDefault')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <section aria-labelledby="add-h" className="border-cream-200 rounded-3xl border bg-white p-6">
        <h2 id="add-h" className="mb-4 text-lg font-semibold">
          {t('addHeading')}
        </h2>
        <AddressForm makeDefault={addresses?.length === 0} onSaved={() => void load()} />
      </section>
    </div>
  );
}
