'use client';

import { Button } from '@biobloom/ui';

/** Previous / next pager with a polite live summary of the visible range. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  label = 'Pagination',
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-forest-600 text-sm" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous<span className="sr-only"> page</span>
        </Button>
        <span className="text-forest-600 self-center text-sm">
          Page {page} of {pages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next<span className="sr-only"> page</span>
        </Button>
      </div>
    </nav>
  );
}
