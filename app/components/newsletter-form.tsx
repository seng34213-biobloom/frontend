'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { buttonClass } from './button-styles';
import { inputClass } from './form-styles';

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
    <section aria-labelledby={`${inputId}-heading`} className="space-y-2">
      <h2 id={`${inputId}-heading`} className="text-base font-normal">
        {t('heading')}
      </h2>
      <div aria-live="polite">
        {done ? (
          <p className="bg-sun border border-black p-4 text-sm font-medium">
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
          <input
            id={inputId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={inputClass}
          />
          <button type="submit" className={buttonClass('action', 'w-full')}>
            {t('submit')}
          </button>
          {error && (
            <p id={errorId} role="alert" className="text-danger-700 text-sm font-semibold">
              <span aria-hidden="true">! </span>
              {error}
            </p>
          )}
        </form>
      )}
      <p className="text-sm">{t('lead')}</p>
    </section>
  );
}
