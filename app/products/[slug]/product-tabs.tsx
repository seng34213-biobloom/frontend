'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type TabKey = 'description' | 'ingredients' | 'reviews';
const TABS: TabKey[] = ['description', 'ingredients', 'reviews'];

/**
 * Description / Ingredients & Allergens / Reviews tabs (SDS §6.2), following
 * the WAI-ARIA APG tabs pattern with roving tabindex and arrow-key support.
 */
export function ProductTabs({
  description,
  ingredients,
  reviews,
  reviewCount,
}: {
  description: ReactNode;
  ingredients: ReactNode;
  reviews: ReactNode;
  reviewCount: number;
}) {
  const t = useTranslations('pdp.tabs');
  const baseId = useId();
  const [active, setActive] = useState<TabKey>('description');
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    description: null,
    ingredients: null,
    reviews: null,
  });
  const panels: Record<TabKey, ReactNode> = { description, ingredients, reviews };

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.indexOf(active);
    let next: TabKey | null = null;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length];
    if (e.key === 'Home') next = TABS[0];
    if (e.key === 'End') next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="space-y-5" aria-label={t('label')}>
      <div
        role="tablist"
        aria-label={t('label')}
        className="border-cream-200 flex flex-wrap gap-1 border-b"
      >
        {TABS.map((key) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[key] = el;
            }}
            id={`${baseId}-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={active === key}
            aria-controls={`${baseId}-panel-${key}`}
            tabIndex={active === key ? 0 : -1}
            onClick={() => setActive(key)}
            onKeyDown={onKeyDown}
            className={`-mb-px rounded-t-xl border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === key
                ? 'border-brand-600 text-forest-700'
                : 'text-forest-500 hover:text-forest-700 border-transparent'
            }`}
          >
            {key === 'reviews' ? t('reviews', { count: reviewCount }) : t(key)}
          </button>
        ))}
      </div>
      {TABS.map((key) => (
        <div
          key={key}
          id={`${baseId}-panel-${key}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${key}`}
          hidden={active !== key}
          tabIndex={0}
          className="rounded-2xl outline-none"
        >
          {panels[key]}
        </div>
      ))}
    </section>
  );
}
