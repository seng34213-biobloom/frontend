import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info';

const toneClasses: Record<Tone, string> = {
  error: 'bg-blush',
  success: 'bg-brand-200',
  info: 'bg-cream-100',
};

const toneIcon: Record<Tone, string> = { error: '!', success: '✓', info: 'i' };

/**
 * Inline message conveyed by text and an icon, not colour alone (WCAG
 * 1.4.1). Errors use role="alert"; other tones are polite status messages.
 */
export function InlineAlert({
  tone = 'error',
  id,
  children,
  className = '',
}: {
  tone?: Tone;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 border border-black p-4 text-sm font-medium text-black ${toneClasses[tone]} ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
      >
        {toneIcon[tone]}
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}
