import * as React from 'react';

type Align = 'left' | 'right' | 'center';
const alignClass: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  /** Describes the table for screen readers (WCAG 1.3.1). */
  caption: React.ReactNode;
  /** Keep the caption for assistive tech only. */
  captionHidden?: boolean;
};

/**
 * Data table wrapper. The scroll container is a labelled, focusable region
 * so keyboard users can scroll wide tables at 320px (WCAG 1.4.10, 2.1.1).
 */
export function Table({
  caption,
  captionHidden = true,
  className = '',
  children,
  ...rest
}: TableProps) {
  const captionId = `table-${React.useId().replace(/:/g, '')}-caption`;
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className="border-cream-300 overflow-x-auto rounded-xl border bg-white"
    >
      <table className={`w-full text-sm ${className}`.trim()} {...rest}>
        <caption
          id={captionId}
          className={
            captionHidden ? 'sr-only' : 'text-forest-600 px-4 pt-3 text-left text-sm font-semibold'
          }
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-cream-100 text-forest-600 text-xs uppercase tracking-widest">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-cream-200 divide-y">{children}</tbody>;
}

export function Th({
  align = 'left',
  scope = 'col',
  className = '',
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <th
      scope={scope}
      className={`whitespace-nowrap px-4 py-3 font-semibold ${alignClass[align]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  align = 'left',
  className = '',
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <td
      className={`text-forest-700 px-4 py-3 align-top ${alignClass[align]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Single full-width row for empty / loading states inside a table body. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-forest-500 px-4 py-6 text-center">
        {children}
      </td>
    </tr>
  );
}
