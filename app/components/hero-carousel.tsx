'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useState } from 'react';
import { ButtonLink } from './button-link';

const SLIDES = [
  { key: 'seasonal', href: '/products?category=jams', tone: 'bg-brand-50' },
  { key: 'subscribe', href: '/products', tone: 'bg-clay-100' },
  { key: 'gifts', href: '/bundles', tone: 'bg-cream-100' },
] as const;

const ROTATE_MS = 7000;

/**
 * Homepage hero carousel (SDS §6.1) following the WAI-ARIA APG carousel
 * pattern: explicit previous/next/pause controls, slide picker buttons,
 * rotation stops on hover, focus, or when the visitor prefers reduced motion,
 * and the live region only announces slides changed by the visitor.
 */
export function HeroCarousel() {
  const t = useTranslations('home.hero');
  const regionId = useId();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  const rotating = playing && !hovered && !focused && !reducedMotion;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotating]);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  const controlClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-forest-700/20 bg-cream-50 text-forest-700 transition-colors hover:bg-cream-100';

  return (
    <section
      aria-roledescription={t('roleDescription')}
      aria-label={t('label')}
      className="border-cream-200 relative overflow-hidden rounded-3xl border shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div id={regionId} aria-live={rotating ? 'off' : 'polite'}>
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            role="group"
            aria-roledescription={t('slide')}
            aria-label={t('slideOf', { n: i + 1, total: SLIDES.length })}
            hidden={i !== index}
            className={`${slide.tone} label-panel grid min-h-[22rem] gap-6 px-6 py-10 sm:px-10 md:min-h-[26rem] md:grid-cols-[1.3fr_0.7fr] md:items-center md:px-14`}
          >
            <div className="flex flex-col items-start gap-5">
              <span className="border-cream-300 bg-cream-50 text-clay-500 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
                <span aria-hidden="true" className="bg-brand-500 h-1.5 w-1.5 rounded-full" />
                {t(`${slide.key}.eyebrow`)}
              </span>
              <h2 className="text-forest-700 font-serif text-4xl sm:text-5xl lg:text-6xl">
                {t(`${slide.key}.title`)}
              </h2>
              <p className="text-forest-500 max-w-xl text-lg leading-relaxed">
                {t(`${slide.key}.body`)}
              </p>
              <ButtonLink href={slide.href} className="px-6 py-3 text-base">
                {t(`${slide.key}.cta`)}
              </ButtonLink>
            </div>
            <div aria-hidden="true" className="hidden justify-center md:flex">
              <span className="border-cream-300 bg-cream-50/70 text-forest-700/20 flex h-48 w-48 items-center justify-center rounded-full border font-serif text-7xl shadow-lg">
                {['✦', '↻', '❀'][i]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-cream-200 bg-cream-50/90 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={controlClass}
            aria-label={playing ? t('pause') : t('play')}
          >
            <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
          </button>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className={controlClass}
            aria-controls={regionId}
            aria-label={t('previous')}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className={controlClass}
            aria-controls={regionId}
            aria-label={t('next')}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label={t('choose')}>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={t('slideOf', { n: i + 1, total: SLIDES.length })}
              aria-current={i === index ? 'true' : undefined}
              aria-controls={regionId}
              className="flex h-10 w-10 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={`block h-2.5 rounded-full transition-all ${i === index ? 'bg-brand-600 w-6' : 'bg-forest-500 w-2.5'}`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
