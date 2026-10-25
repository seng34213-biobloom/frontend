'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { buttonClass } from './button-styles';
import { inputClass } from './form-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up (SDS §6.1 footer). There is no subscription endpoint
 * yet, so the form validates the address and confirms locally.
 */
export function NewsletterForm() {
  const t = useTranslations('newsletter');
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('invalidEmail'));
      return;
    }
    setError(null);
    setDone(true);
  }

  return (
    <section aria-labelledby={`${inputId}-heading`} className="max-w-sm space-y-3">
      <h2 id={`${inputId}-heading`} className="text-forest-700 text-sm font-semibold">
        {t('heading')}
      </h2>
      <p className="text-forest-500 text-sm">{t('lead')}</p>
      <div aria-live="polite">
        {done ? (
          <p className="border-brand-300 bg-brand-50 text-brand-800 rounded-2xl border p-3 text-sm font-medium">
            <span aria-hidden="true">✓ </span>
            {t('thanks', { email: email.trim() })}
          </p>
        ) : null}
      </div>
      {!done && (
        <form onSubmit={onSubmit} noValidate className="space-y-2">
          <label htmlFor={inputId} className="sr-only">
            {t('emailLabel')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button type="submit" className={buttonClass('primary')}>
              {t('submit')}
            </button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-danger-700 text-xs font-semibold">
              <span aria-hidden="true">! </span>
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
