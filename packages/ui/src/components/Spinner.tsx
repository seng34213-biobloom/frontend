import * as React from 'react';

/**
 * Loading indicator. The visible ring is decorative; the label is exposed
 * through a polite status region so screen readers announce it once.
 */
export function Spinner({
  label = 'Loading…',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={`text-forest-500 inline-flex items-center gap-2 text-sm ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
      />
      <span>{label}</span>
    </span>
  );
}
