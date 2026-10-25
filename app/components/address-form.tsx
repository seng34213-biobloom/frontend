'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Button } from '@biobloom/ui';
import { api } from '../lib/api';
import type { Address } from '../lib/types';
import { TextField } from './form-field';
import { InlineAlert } from './inline-alert';

const EMPTY = { line1: '', line2: '', city: '', district: '', postalCode: '' };

/** Add a Sri Lankan shipping address (used by checkout and the address book). */
export function AddressForm({
  onSaved,
  makeDefault = false,
}: {
  onSaved: (a: Address) => void;
  makeDefault?: boolean;
}) {
  const t = useTranslations('address');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: Partial<Record<keyof typeof EMPTY, string>> = {};
    if (!form.line1.trim()) found.line1 = t('required');
    if (!form.city.trim()) found.city = t('required');
    if (!form.district.trim()) found.district = t('required');
    if (!/^\d{5}$/.test(form.postalCode.trim())) found.postalCode = t('postalCodeRule');
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await api<Address>('POST', '/api/addresses', {
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        district: form.district.trim(),
        postalCode: form.postalCode.trim(),
        isDefault: makeDefault,
      });
      setForm(EMPTY);
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const bind = (k: keyof typeof EMPTY) => ({
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
    error: errors[k],
  });

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      {error ? (
        <div className="sm:col-span-2">
          <InlineAlert>{error}</InlineAlert>
        </div>
      ) : null}
      <TextField
        label={t('line1')}
        autoComplete="address-line1"
        required
        {...bind('line1')}
        className="sm:col-span-2"
      />
      <TextField
        label={t('line2')}
        autoComplete="address-line2"
        {...bind('line2')}
        className="sm:col-span-2"
      />
      <TextField label={t('city')} autoComplete="address-level2" required {...bind('city')} />
      <TextField
        label={t('district')}
        autoComplete="address-level1"
        required
        {...bind('district')}
      />
      <TextField
        label={t('postalCode')}
        autoComplete="postal-code"
        inputMode="numeric"
        required
        {...bind('postalCode')}
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
