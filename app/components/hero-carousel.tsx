'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useState } from 'react';
import { HeroDoodles } from './brush-art';
import { ButtonLink } from './button-link';
import { ProductArt } from './product-art';

const SLIDES = [
  {
    key: 'seasonal',
    href: '/products?category=jams',
    packs: [
      { name: 'Strawberry Jam', category: 'jams' },
      { name: 'Mango Chutney', category: 'chutneys' },
    ],
  },
  {
    key: 'subscribe',
    href: '/products',
    packs: [
      { name: 'Lime Pickle', category: 'pickles' },
      { name: 'Kithul Treacle', category: 'sweeteners' },
    ],
  },
  {
    key: 'gifts',
    href: '/bundles',
    packs: [
      { name: 'Tomato Relish', category: 'relishes' },
      { name: 'Roasted Curry Spice', category: 'spices' },
    ],
  },
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
    'flex h-10 w-10 items-center justify-center border border-black text-black hover:bg-sun';

  return (
    <section
      aria-roledescription={t('roleDescription')}
      aria-label={t('label')}
      className="band relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        id={regionId}
        aria-live={rotating ? 'off' : 'polite'}
        className="relative overflow-hidden bg-white"
      >
        <HeroDoodles className="absolute left-1/2 top-[30%] h-auto w-[210%] max-w-none -translate-x-1/2 md:left-0 md:top-0 md:h-full md:w-full md:translate-x-0" />
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            role="group"
            aria-roledescription={t('slide')}
            aria-label={t('slideOf', { n: i + 1, total: SLIDES.length })}
            hidden={i !== index}
            className={`${i === index ? 'grid' : 'hidden'} relative min-h-[34rem] grid-cols-1 gap-4 px-6 py-10 md:min-h-[41rem] md:grid-cols-[1.05fr_1fr] md:items-center md:px-[6.5%] md:py-12`}
          >
            <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
              <p className="caps text-sm font-medium">{t(`${slide.key}.eyebrow`)}</p>
              <h2 className="font-serif text-4xl lg:text-5xl">{t(`${slide.key}.title`)}</h2>
              <p className="caps max-w-md font-medium">{t(`${slide.key}.body`)}</p>
              <ButtonLink href={slide.href} variant="cta" className="mt-3 min-w-[11.5rem]">
                {t(`${slide.key}.cta`)}
              </ButtonLink>
            </div>
            <div aria-hidden="true" className="flex items-end justify-center md:justify-start">
              <ProductArt
                name={slide.packs[0].name}
                category={slide.packs[0].category}
                className="-mr-[6%] h-[15rem] w-auto md:h-[21rem]"
              />
              <ProductArt
                name={slide.packs[1].name}
                category={slide.packs[1].category}
                className="h-[20rem] w-auto md:h-[30rem]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black px-5 py-2 md:px-7">
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
        <div className="flex items-center gap-1" role="group" aria-label={t('choose')}>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={t('slideOf', { n: i + 1, total: SLIDES.length })}
              aria-current={i === index ? 'true' : undefined}
              aria-controls={regionId}
              className="flex h-10 w-10 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block h-3.5 w-3.5 rounded-full border border-black ${i === index ? 'bg-black' : ''}`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
