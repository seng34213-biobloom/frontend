'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Button } from '@biobloom/ui';
import { TextField } from '../components/form-field';
import { InlineAlert } from '../components/inline-alert';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { safeNextPath } from '../lib/navigation';

type Tab = 'signin' | 'register';

/** Same rule the API enforces on registration (DDP-#04, WCAG 3.3.3). */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Sign in or register (DDP-#07). Errors from the API are shown inline and
 * announced; the password rule is shown before the first attempt and linked
 * to the field. `next` is only followed when it is a same-site path.
 */
function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const next = safeNextPath(params.get('next'), '/');
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(undefined);
    if (tab === 'register' && !PASSWORD_RULE.test(password)) {
      setPasswordError(t('passwordRule'));
      return;
    }
    setBusy(true);
    try {
      if (tab === 'register') {
        await api('POST', '/api/auth/register', {
          email: email.trim(),
          password,
          name: name.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        });
      }
      await api('POST', '/api/auth/login', { email: email.trim(), password });
      await refresh();
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tabButton = (value: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      aria-controls="auth-panel"
      onClick={() => {
        setTab(value);
        setError(null);
        setPasswordError(undefined);
      }}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
        tab === value ? 'bg-forest-700 text-cream-50' : 'text-forest-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-forest-700 font-serif text-4xl">
        {tab === 'signin' ? t('signInHeading') : t('registerHeading')}
      </h1>
      <p className="text-forest-600 mt-2">{t('lead')}</p>
      <div
        role="tablist"
        aria-label={t('tabsLabel')}
        className="border-cream-200 bg-cream-100/60 mb-5 mt-6 flex gap-1 rounded-full border p-1"
      >
        {tabButton('signin', t('signInTab'))}
        {tabButton('register', t('registerTab'))}
      </div>
      <form id="auth-panel" role="tabpanel" onSubmit={submit} className="space-y-4" noValidate>
        {error ? (
          <div role="alert">
            <InlineAlert>{error}</InlineAlert>
          </div>
        ) : null}
        {tab === 'register' ? (
          <>
            <TextField
              label={t('name')}
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label={t('phone')}
              autoComplete="tel"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        ) : null}
        <TextField
          label={t('email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t('password')}
          type="password"
          required
          autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          hint={tab === 'register' ? t('passwordRule') : undefined}
          error={passwordError}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy ? t('working') : tab === 'signin' ? t('signInTab') : t('registerTab')}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
