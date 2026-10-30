import { useId } from 'react';

/** Small ink seeds scattered around the hero, as [x, y, rotation]. */
const SEEDS = [
  [118, 520, 20],
  [150, 548, -30],
  [176, 512, 60],
  [202, 540, 10],
  [226, 508, -50],
  [240, 556, 35],
  [1188, 112, 40],
  [1214, 84, -20],
  [1240, 120, 70],
  [1266, 92, 15],
  [1296, 118, -40],
  [1322, 88, 25],
  [642, 88, 30],
  [668, 52, -60],
  [1012, 560, 45],
  [1050, 596, -15],
] as const;

/**
 * Hand-inked doodles behind the hero: brush swooshes, poster-colour dots, a
 * jam spoon, a strawberry and a chilli. A displacement filter roughens the
 * vector edges so they read as ink on paper. Decorative only.
 */
export function HeroDoodles({ className = '' }: { className?: string }) {
  const filterId = `ink-${useId().replace(/:/g, '')}`;
  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <path d="M-30 98c150 6 210-52 330-78 118-24 214 30 342 118-132-70-224-106-330-92-124 16-180 72-342 66z" />
        <path d="M918 590c112-112 240-146 368-110 66 18 116 26 176 12v14c-66 18-122 4-184-12-126-32-236 2-360 96z" />

        <circle cx="736" cy="196" r="34" fill="#fff37a" stroke="#000" strokeWidth="6" />
        <circle cx="472" cy="428" r="40" fill="#5b8bd8" stroke="#000" strokeWidth="6" />
        <circle cx="520" cy="402" r="16" fill="#2a3f73" stroke="#000" strokeWidth="5" />
        <circle cx="1262" cy="470" r="18" fill="#f9c5d3" stroke="#000" strokeWidth="5" />
        <circle cx="1304" cy="476" r="32" fill="#96b86c" stroke="#000" strokeWidth="6" />
        <circle cx="-6" cy="470" r="40" fill="#5b8bd8" stroke="#000" strokeWidth="6" />

        {SEEDS.map(([x, y, r]) => (
          <path
            key={`${x}-${y}`}
            d="M0-14c9 2 12 12 10 20-2 7-9 11-14 8-7-4-8-14-4-21 2-4 5-7 8-7z"
            transform={`translate(${x} ${y}) rotate(${r})`}
          />
        ))}

        {/* Jam spoon with a drip */}
        <g transform="translate(250 -56) scale(0.92)">
          <path
            d="M1336 196c-70 6-152 44-222 98-16 12-30 8-34-4-4-14 8-24 24-30 74-30 150-68 228-84z"
            fill="#fff37a"
            stroke="#000"
            strokeWidth="6"
          />
          <path
            d="M1074 266c-22 12-44 34-40 56 4 18 28 22 50 8 22-14 40-40 30-60-8-14-24-14-40-4z"
            fill="#6d1330"
            stroke="#000"
            strokeWidth="6"
          />
          <path
            d="M1050 334c-4 40 14 66 8 104-3 22-26 24-26 0 0-36-8-64 0-106z"
            fill="#6d1330"
            stroke="#000"
            strokeWidth="5"
          />
        </g>

        {/* Strawberry */}
        <g transform="translate(346 520) rotate(-14)">
          <path
            d="M0-44c30-12 66 2 64 34-2 34-36 66-62 78-28-14-62-46-64-80-2-30 34-44 62-32z"
            fill="#e8405a"
            stroke="#000"
            strokeWidth="6"
          />
          <path
            d="M-34-44c12-4 22-2 34 4 12-8 24-8 36-2-8 6-14 12-16 22-6-8-12-10-20-10-8 0-14 4-18 12-2-10-6-20-16-26z"
            fill="#96b86c"
            stroke="#000"
            strokeWidth="5"
          />
          <path
            d="M-26 0l4 8M4 8l4 8M34-6l-3 8M-8 30l4 8M20 34l-3 8"
            stroke="#fff37a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Chilli */}
        <g transform="translate(1282 560) rotate(8)">
          <path
            d="M-74-30c24 34 76 44 146 18 12-4 18 4 8 12-62 46-150 42-186-6-10-14 22-38 32-24z"
            fill="#e8402f"
            stroke="#000"
            strokeWidth="6"
          />
          <path
            d="M-76-30c-8-14-8-24 0-34 4-6 12-2 10 6-2 8 0 14 8 22"
            fill="#96b86c"
            stroke="#000"
            strokeWidth="5"
          />
        </g>
      </g>
    </svg>
  );
}
