/**
 * Bio Bloom Tailwind preset — "Pantry Poster" design system.
 *
 * Visual language: a loud, printed-label storefront. Butter-cream paper, pure
 * black ink and hairline rules that divide every page into full-bleed bands,
 * with flat poster colours (pink, yellow, blue, orange, green) instead of
 * shadows or gradients. Corners are square throughout.
 *
 * Semantic tokens (do NOT import raw shade names in app code):
 *   brand.*       — ink for actions (600+ = black) over soft green tints (50-400)
 *   cream.*       — butter-paper neutrals (page, panels)
 *   clay.*        — warm orange tints (labels, highlights)
 *   forest.*      — ink for text; 700 = black, 300/400 = AA subtle text
 *   amber.*       — "expiring-soon" / bestseller badges
 *   danger.*      — expired batch / critical errors
 *   sun, blush, bubblegum, sky, tangerine, leaf, bark, ocean — flat poster colours
 *
 * Every shade referenced anywhere in the apps is defined here so no class
 * silently falls back to inherited colour. Contrast of text shades against
 * the paper background (cream.50) meets WCAG AA.
 *
 * Type sizes multiply `--type-scale` (see globals.css): the storefront runs a
 * large poster scale and the console a tighter one, from the same utilities.
 */
const scaled = (rem, lineHeight) => [`calc(${rem}rem * var(--type-scale, 1))`, { lineHeight }];

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Actions are black ink; the 50-400 tints keep a soft green for success states.
        brand: {
          50: '#eef4dd',
          100: '#dfeac4',
          200: '#c9dca3',
          300: '#96b86c',
          400: '#6f9445',
          500: '#000000',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
        // Ink. 700 = headlines and body, 400 = AA subtle text.
        forest: {
          200: '#c9c3a4',
          300: '#7a7660',
          400: '#55523f',
          500: '#3a382a',
          600: '#1c1b14',
          700: '#000000',
          800: '#000000',
        },
        // Butter paper. 50 = page, 100 = panel, 200/300 = deeper panels.
        cream: {
          50: '#fef9d9',
          100: '#fbf3c4',
          200: '#f4eab0',
          300: '#e6db9a',
          400: '#b9ae72',
        },
        // Warm accent — tangerine tints with a bark-brown text shade.
        clay: {
          50: '#fff2e8',
          100: '#ffe3d0',
          200: '#ffc9a6',
          300: '#ff9a5c',
          400: '#c75a1a',
          500: '#382517',
        },
        amber: {
          50: '#fffbd1',
          100: '#fff37a',
          200: '#ffe95c',
          400: '#d9b100',
          600: '#7f6600',
          700: '#5c4a00',
        },
        danger: {
          50: '#fde8ee',
          100: '#f9c5d3',
          300: '#e88aa3',
          500: '#c2233f',
          700: '#8e1430',
          900: '#5c0c1e',
        },
        sun: '#fff37a',
        blush: '#f9c5d3',
        bubblegum: '#ffa9c0',
        sky: '#5b8bd8',
        tangerine: '#ff9a5c',
        leaf: '#96b86c',
        bark: '#382517',
        ocean: '#0077c8',
      },
      fontFamily: {
        // Slots resolve to the families loaded via next/font in app/layout.tsx.
        sans: [
          'var(--font-body)',
          'var(--font-sinhala)',
          '"Helvetica Neue"',
          'Helvetica',
          'sans-serif',
        ],
        serif: ['var(--font-display)', 'var(--font-sinhala)', 'Georgia', 'serif'],
        logo: ['var(--font-logo)', 'Impact', 'sans-serif'],
      },
      fontSize: {
        xs: scaled(0.75, '1.5'),
        sm: scaled(0.875, '1.55'),
        base: scaled(1, '1.6'),
        lg: scaled(1.125, '1.5'),
        xl: scaled(1.25, '1.4'),
        '2xl': scaled(1.5, '1.3'),
        '3xl': scaled(1.875, '1.25'),
        '4xl': scaled(2.25, '1.2'),
        '5xl': scaled(3, '1.1'),
        '6xl': scaled(3.75, '1.05'),
      },
      letterSpacing: {
        tightest: '-0.01em',
        display: '0',
        caps: '0.07em',
        wider: '0.07em',
        widest: '0.07em',
      },
      // Square corners everywhere; `rounded-full` stays for genuine circles.
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        cta: '0.625rem',
      },
      // Flat print: depth comes from rules and colour, never from shadows.
      boxShadow: {
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.45, 0, 0.55, 1)',
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
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-soft both',
        'fade-up': 'fade-up 0.3s ease-soft both',
        'pop-in': 'pop-in 0.2s ease-soft both',
        'slide-in': 'slide-in 0.25s ease-soft both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
};
