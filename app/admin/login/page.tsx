'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input } from '@biobloom/ui';
import { adminApi, errorMessage } from '../../lib/admin/api';
import { useAuth } from '../../lib/admin/auth-context';
import { ADMIN_HOME, isConsolePath, isStaffRole } from '../../lib/admin/nav';

/** Only console paths are accepted as a post-login destination. */
function safeNext(next: string | null): string {
  return next && isConsolePath(next) ? next : ADMIN_HOME;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get('next'));

  useEffect(() => {
    if (user && isStaffRole(user.role)) router.replace(next);
  }, [user, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi<{ role: string }>('POST', '/api/auth/login', { email, password });
      if (!isStaffRole(res.role)) {
        await adminApi('POST', '/api/auth/logout').catch(() => undefined);
        setError('This console is for Bio Bloom staff. Customers and sellers use their own sites.');
        return;
      }
      await refresh();
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="text-forest-800 text-2xl font-semibold">Admin console sign-in</h1>
      <p className="text-forest-500 mt-1 text-sm">For administrators and fulfilment staff.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <FormField label="Email" required>
          <Input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={busy || !email || !password} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
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
