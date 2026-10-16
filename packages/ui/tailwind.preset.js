/**
 * Bio Bloom Tailwind preset — "Artisan Pantry" design system.
 *
 * Visual language (reskin per design references): a warm, editorial,
 * specialty-grocer aesthetic — paper-warm neutrals, near-black ink, a
 * confident artisan green, and an Inter-based type system with heavy,
 * tightly-tracked display headings. Premium, handcrafted, trustworthy.
 *
 * Semantic tokens (do NOT import raw shade names in app code):
 *   brand.*       — primary artisan green (buttons, navigation, accents)
 *   cream.*       — warm paper neutrals (page, card, hairline borders)
 *   clay.*        — warm accent (category labels, highlights)
 *   forest.*      — near-black warm ink (headlines, body, emphasis)
 *   amber.*       — "expiring-soon" / bestseller badges
 *   danger.*      — expired batch / critical errors
 *
 * Every shade referenced anywhere in the apps is defined here so no class
 * silently falls back to inherited colour. Contrast of text shades against
 * the paper background (cream.50) meets WCAG AA.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Artisan green — refined, earthy, premium. 600 = primary CTA.
        brand: {
          50: '#eef4ea',
          100: '#dbe8d0',
          200: '#bcd4aa',
          300: '#94ba7c',
          400: '#6f9d57',
          500: '#527d3b',
          600: '#3f632e',
          700: '#314e25',
          800: '#283e1f',
          900: '#21321b',
        },
        // Warm near-black ink. 700 = display ink, 400 = AA subtle text.
        forest: {
          200: '#cec7b8',
          300: '#8c8473',
          400: '#6b6457',
          500: '#4c473c',
          600: '#2c2820',
          700: '#1a1712',
        },
        // Paper-warm neutrals. 50 = page, 100 = card panel, 200/300 = borders.
        cream: {
          50: '#faf7f0',
          100: '#f3eee2',
          200: '#e8e0cf',
          300: '#d7cbb3',
          400: '#bcab88',
        },
        // Warm accent — kraft / vanilla-bean tones for labels & highlights.
        clay: {
          100: '#f1e7d3',
          200: '#e3d0aa',
          300: '#cba877',
          400: '#a9824b',
          500: '#7d5d2f',
        },
        amber: {
          100: '#f8e8c2',
          400: '#e0a93b',
          600: '#9a6b14',
          700: '#7a5410',
        },
        danger: {
          50: '#fbeae7',
          100: '#f6d6d1',
          300: '#e3a9a0',
          500: '#c2443b',
          700: '#8a2d26',
          900: '#5e1d18',
        },
      },
      fontFamily: {
        // Both slots resolve to Inter (loaded via next/font as --font-inter).
        // The "serif" slot is retained for backward compatibility — existing
        // `font-serif` headings now render as heavy, tightly-tracked Inter
        // display type (see globals.css base layer).
        sans: [
          'var(--font-inter)',
          '"Inter"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        serif: [
          'var(--font-inter)',
          '"Inter"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
        display: '-0.025em',
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        // Soft, warm, low-contrast elevation — premium not heavy.
        sm: '0 1px 2px rgba(26,23,18,0.04), 0 1px 3px rgba(26,23,18,0.05)',
        DEFAULT: '0 2px 8px -2px rgba(26,23,18,0.07)',
        md: '0 6px 20px -6px rgba(26,23,18,0.10)',
        lg: '0 16px 40px -12px rgba(26,23,18,0.14)',
        xl: '0 28px 60px -18px rgba(26,23,18,0.18)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '60%': { opacity: '1', transform: 'translateY(0) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-soft both',
        'fade-up': 'fade-up 0.5s ease-soft both',
        'pop-in': 'pop-in 0.32s ease-soft both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
};
