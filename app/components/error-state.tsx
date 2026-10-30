'use client';

import { useTranslations } from 'next-intl';
import { buttonClass } from './button-styles';
import { ButtonLink } from './button-link';

/**
 * Friendly error state for route `error.tsx` boundaries — shown when the API
 * cannot be reached instead of a crash (DDP-#19 AC2).
 */
export function ErrorState({ reset }: { reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <section className="flex flex-col items-center gap-5 px-7 py-32 text-center">
      <h1 className="font-serif text-3xl md:text-4xl">{t('unavailableTitle')}</h1>
      <p role="alert" className="max-w-md">
        {t('unavailableBody')}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClass('primary')}>
          {t('retry')}
        </button>
        <ButtonLink href="/" variant="secondary">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  );
}
