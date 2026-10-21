'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@biobloom/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

type Tab = 'signin' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const next = params.get('next') ?? '/';

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('tharushi@example.com');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === 'register') {
        await api('POST', '/api/auth/register', {
          email,
          password,
          name,
          phone: phone || undefined,
        });
      }
      await api('POST', '/api/auth/login', { email, password });
      await refresh();
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md animate-fade-up flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-3 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-serif text-xl font-extrabold text-cream-50 shadow-sm"
        >
          B
        </span>
        <h1 className="font-serif text-3xl text-forest-700">
          {tab === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-forest-500">
          {tab === 'signin'
            ? 'Sign in to manage your cart, subscriptions, and orders.'
            : 'A free account so we can save your cart and subscriptions.'}
        </p>
      </header>

      <div className="rounded-3xl border border-cream-200 bg-cream-50 p-6 shadow-md sm:p-7">
      <div role="tablist" className="mb-5 flex gap-1 rounded-full border border-cream-200 bg-cream-100/60 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'signin'}
          onClick={() => {
            setTab('signin');
            setError(null);
          }}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ease-soft ${
            tab === 'signin'
              ? 'bg-brand-600 text-cream-50 shadow-sm'
              : 'text-forest-500 hover:text-forest-700'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          onClick={() => {
            setTab('register');
            setError(null);
          }}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ease-soft ${
            tab === 'register'
              ? 'bg-brand-600 text-cream-50 shadow-sm'
              : 'text-forest-500 hover:text-forest-700'
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {tab === 'register' && (
          <>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                Phone (optional)
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
          </>
        )}
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          {tab === 'register' && (
            <span className="mt-1 block text-xs text-forest-400">
              At least 8 characters with a letter and a digit.
            </span>
          )}
        </label>

        {error && (
          <p className="rounded-lg border border-danger-300 bg-danger-50 p-3 text-sm text-danger-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full py-3 text-base">
          {busy
            ? 'Please wait…'
            : tab === 'signin'
              ? 'Sign in'
              : 'Create account & sign in'}
        </Button>
      </form>
      </div>

      <p className="rounded-2xl border border-cream-200 bg-cream-100/50 p-4 text-xs leading-relaxed text-forest-500">
        <strong className="font-semibold text-forest-700">Demo accounts</strong> — every seeded user has password
        <code className="mx-1 rounded bg-cream-100 px-1.5 py-0.5 text-forest-700">
          Password123!
        </code>
        . Try{' '}
        <code className="mx-1 rounded bg-cream-100 px-1.5 py-0.5 text-forest-700">
          tharushi@example.com
        </code>{' '}
        for a customer with orders &amp; subscriptions.
      </p>
    </section>
  );
}
