'use client';

import { Button } from '@biobloom/ui';

/**
 * Shown to signed-in accounts that may not open the console (customers,
 * sellers, riders) or a specific page (fulfilment staff on admin pages).
 * Renders no admin data at all.
 */
export function AccessDenied({
  email,
  message,
  onSignOut,
}: {
  email?: string;
  message: string;
  onSignOut?: () => void;
}) {
  return (
    <section
      aria-labelledby="access-denied-title"
      className="border-danger-300 bg-danger-50 mx-auto max-w-lg space-y-4 rounded-2xl border p-6"
    >
      <h1 id="access-denied-title" className="text-danger-700 font-serif text-2xl">
        Access denied
      </h1>
      <p className="text-danger-700 text-sm">{message}</p>
      {email ? (
        <p className="text-forest-600 text-sm">
          Signed in as <span className="font-semibold">{email}</span>.
        </p>
      ) : null}
      {onSignOut ? (
        <Button variant="secondary" onClick={onSignOut}>
          Sign out and use a staff account
        </Button>
      ) : null}
    </section>
  );
}
