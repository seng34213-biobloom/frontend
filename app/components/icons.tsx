/** Thin outline icons shared by the storefront header, cart and gallery. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function CartIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 3.5h3l2.6 12.2h10.2l2.6-9.2H6.3" />
      <circle cx="9.6" cy="20" r="1" />
      <circle cx="16.8" cy="20" r="1" />
    </svg>
  );
}

export function UserIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4.2" />
      <path d="M3.8 21c.5-4.4 3.9-6.6 8.2-6.6s7.7 2.2 8.2 6.6z" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
    </svg>
  );
}

export function TrashIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 6.5h15M9 6.5V4h6v2.5M6 6.5l.8 14h10.4l.8-14M10 10.5v6.5M14 10.5v6.5" />
    </svg>
  );
}

export function MinusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 12h17" />
    </svg>
  );
}

export function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5v17M3.5 12h17" />
    </svg>
  );
}

/** Small solid caret used on dropdowns and accordions. */
export function CaretIcon({ className = 'h-2 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 7" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M0 0h12L6 7z" />
    </svg>
  );
}
