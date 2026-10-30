'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { CaretIcon } from '../../components/icons';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-t border-black">
      <summary className="caps flex items-center justify-between px-7 py-6">
        {title}
        <CaretIcon className="h-1.5 w-2.5 rotate-180 transition-transform group-open:rotate-0" />
      </summary>
      <div className="border-t border-black px-7 py-6">{children}</div>
    </details>
  );
}

/** Ingredients and allergens as open-by-default disclosures (SDS §6.2). */
export function ProductAccordions({
  ingredients,
  allergens,
}: {
  ingredients: ReactNode;
  allergens: ReactNode;
}) {
  const t = useTranslations('pdp');
  return (
    <section aria-label={t('tabs.label')}>
      <Section title={t('ingredients')}>{ingredients}</Section>
      <Section title={t('allergens')}>{allergens}</Section>
    </section>
  );
}
