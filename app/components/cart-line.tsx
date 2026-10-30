'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MinusIcon, PlusIcon, TrashIcon } from './icons';
import { ProductImage } from './product-image';
import type { CartLine } from '../lib/types';

export function cartLineName(line: CartLine): string {
  return line.variant
    ? `${line.variant.productName} — ${line.variant.size}`
    : (line.bundle?.name ?? '');
}

/**
 * One cart row, shared by the drawer and the cart page: pack tile, name and
 * price, then the circled quantity stepper with a remove button beneath it.
 */
export function CartLineRow({
  line,
  busy,
  error,
  onChange,
}: {
  line: CartLine;
  busy: boolean;
  error?: string;
  onChange: (quantity: number) => void;
}) {
  const t = useTranslations('cart');
  const name = cartLineName(line);
  const href = line.variant
    ? `/products/${line.variant.productSlug}`
    : `/bundles/${line.bundle?.slug}`;
  const short = line.available < line.quantity;

  return (
    <li className="grid grid-cols-[6rem_1fr] border-b border-black sm:grid-cols-[7.5rem_1fr]">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="border-r border-black bg-white">
        <ProductImage
          src={null}
          alt=""
          name={line.variant?.productName ?? name}
          sizes="120px"
          className="h-full min-h-[7.5rem]"
        />
      </Link>
      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:gap-6">
        <div className="min-w-0">
          <Link href={href} className="break-words hover:underline">
            {name}
          </Link>
          <p className="text-sm" aria-live="polite">
            {short ? (
              <span className="text-danger-700 font-medium">
                {t('onlyNLeft', { count: line.available })}
              </span>
            ) : (
              t('inStock')
            )}
          </p>
        </div>
        <p className="font-medium">LKR {line.lineSubtotal}</p>
        <div className="flex flex-row-reverse items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(line.quantity - 1)}
              aria-label={t('decrease', { name })}
              className="hover:text-brand-400 p-1 disabled:opacity-40"
            >
              <MinusIcon />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black text-sm">
              <span className="sr-only">{t('quantity')}: </span>
              {line.quantity}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(line.quantity + 1)}
              aria-label={t('increase', { name })}
              className="hover:text-brand-400 p-1 disabled:opacity-40"
            >
              <PlusIcon />
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(0)}
            aria-label={t('removeItem', { name })}
            className="hover:text-danger-700 p-1 disabled:opacity-40"
          >
            <TrashIcon />
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-danger-700 text-sm font-medium sm:col-span-3">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}
