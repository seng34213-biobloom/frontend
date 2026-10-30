import { useId } from 'react';

/**
 * Illustrated pack shot used until a product has a real photo: a jar or bottle
 * with a printed Bio Bloom label in the category's poster colours. Purely
 * decorative, so callers supply the accessible name.
 */

type Palette = {
  contents: string;
  band: string;
  sky: string;
  near: string;
  far: string;
  shape: 'jar' | 'bottle';
};

const PALETTES: Record<string, Palette> = {
  jams: {
    contents: '#6d1330',
    band: '#ffa9c0',
    sky: '#f9c5d3',
    near: '#96b86c',
    far: '#ff9a5c',
    shape: 'jar',
  },
  chutneys: {
    contents: '#6b3410',
    band: '#ff9a5c',
    sky: '#fff37a',
    near: '#ff9a5c',
    far: '#5b8bd8',
    shape: 'jar',
  },
  relishes: {
    contents: '#4e5a18',
    band: '#96b86c',
    sky: '#fff37a',
    near: '#96b86c',
    far: '#382517',
    shape: 'jar',
  },
  pickles: {
    contents: '#8a6a12',
    band: '#fff37a',
    sky: '#5b8bd8',
    near: '#fff37a',
    far: '#96b86c',
    shape: 'jar',
  },
  sweeteners: {
    contents: '#2e170a',
    band: '#5b8bd8',
    sky: '#ff9a5c',
    near: '#5b8bd8',
    far: '#fff37a',
    shape: 'bottle',
  },
  spices: {
    contents: '#6e1b12',
    band: '#ff9a5c',
    sky: '#ffa9c0',
    near: '#c75a1a',
    far: '#fff37a',
    shape: 'bottle',
  },
};

const FALLBACKS = Object.values(PALETTES);

function paletteFor(name: string, category?: string): Palette {
  if (category && PALETTES[category]) return PALETTES[category];
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACKS[hash % FALLBACKS.length];
}

/** Splits a name over at most two label lines, keeping them close in length. */
function labelLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name.trim()];
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const gap = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export function ProductArt({
  name,
  category,
  className = '',
}: {
  name: string;
  category?: string;
  className?: string;
}) {
  const clipId = `panel-${useId().replace(/:/g, '')}`;
  const palette = paletteFor(name, category);
  const lines = labelLines(name);
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = Math.min(25, 300 / Math.max(longest, 1));
  const labelY = palette.shape === 'jar' ? 0 : 36;

  return (
    <svg viewBox="0 0 400 520" aria-hidden="true" className={className}>
      <ellipse cx="216" cy="484" rx="138" ry="11" fill="#000" opacity="0.08" />
      {palette.shape === 'jar' ? (
        <>
          <path
            d="M122 122h156v18c20 8 32 26 32 48v252c0 24-18 42-42 42H132c-24 0-42-18-42-42V188c0-22 12-40 32-48z"
            fill={palette.contents}
          />
          <rect x="112" y="72" width="176" height="56" rx="8" fill="#1c1b14" />
          <path d="M112 112h176M112 96h176" stroke="#fff" strokeOpacity="0.14" strokeWidth="3" />
          <path
            d="M178 62h44v112a22 22 0 0 1-44 0z"
            fill={palette.band}
            stroke="#000"
            strokeWidth="1.5"
          />
        </>
      ) : (
        <>
          <path
            d="M172 86h56v74c0 26 62 42 62 88v196c0 22-16 38-38 38H148c-22 0-38-16-38-38V248c0-46 62-62 62-88z"
            fill={palette.contents}
          />
          <rect x="164" y="34" width="72" height="58" rx="7" fill="#1c1b14" />
          <path d="M164 74h72" stroke="#fff" strokeOpacity="0.14" strokeWidth="3" />
          <path
            d="M181 26h38v148a19 19 0 0 1-38 0z"
            fill={palette.band}
            stroke="#000"
            strokeWidth="1.5"
          />
        </>
      )}
      <rect x="102" y="214" width="12" height="238" rx="6" fill="#fff" opacity="0.16" />

      <g transform={`translate(0 ${labelY})`}>
        <rect
          x="118"
          y="194"
          width="164"
          height="238"
          rx="12"
          fill="#fbf3d6"
          stroke="#000"
          strokeWidth="1.5"
        />
        <text
          x="200"
          y="228"
          textAnchor="middle"
          fontSize="27"
          letterSpacing="0.5"
          fill="#000"
          style={{ fontFamily: 'var(--font-logo), Impact, sans-serif' }}
        >
          BIO BLOOM
        </text>
        <clipPath id={clipId}>
          <rect x="130" y="238" width="140" height="84" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect x="130" y="238" width="140" height="84" fill={palette.sky} />
          <circle cx="238" cy="262" r="13" fill="#fff" stroke="#000" strokeWidth="1.5" />
          <path
            d="M120 300c30-40 56-44 80-20s50 20 80-8v60H120z"
            fill={palette.far}
            stroke="#000"
            strokeWidth="1.5"
          />
          <path
            d="M120 316c34-26 66-26 96-8s44 10 64-2v30H120z"
            fill={palette.near}
            stroke="#000"
            strokeWidth="1.5"
          />
          <path d="M176 330c8-14 30-12 28-24" fill="none" stroke="#000" strokeWidth="5" />
        </g>
        <rect x="130" y="238" width="140" height="84" fill="none" stroke="#000" strokeWidth="1.5" />
        <text
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="800"
          fill="#000"
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
        >
          {lines.map((line, i) => (
            <tspan key={line} x="200" y={(lines.length === 1 ? 362 : 350) + i * (fontSize + 2)}>
              {line}
            </tspan>
          ))}
        </text>
        <path
          d="M118 404h164v16a12 12 0 0 1-12 12H130a12 12 0 0 1-12-12z"
          fill={palette.band}
          stroke="#000"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

/** A little group of packs for gift boxes and bundles. */
export function ProductArtGroup({ names }: { names: string[] }) {
  const shown = names.length > 0 ? names.slice(0, 3) : ['Jam', 'Chutney', 'Treacle'];
  const categories = ['jams', 'sweeteners', 'pickles'];
  return (
    <div className="flex h-full w-full items-end justify-center px-[6%] pb-[6%]">
      {shown.map((name, i) => (
        <ProductArt
          key={`${name}-${i}`}
          name={name}
          category={categories[i]}
          className={`min-w-0 flex-1 ${i === 1 ? '-mx-[4%] h-[86%]' : 'h-[68%]'}`}
        />
      ))}
    </div>
  );
}
