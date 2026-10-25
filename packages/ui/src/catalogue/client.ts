'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The catalogue editors are shared by the admin console and the seller
 * portal. Each app passes its own API client (cookies, CSRF and error
 * mapping stay in the app); the API enforces who may change what.
 */
export interface CatalogueClient {
  request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T>;
  uploadProductImage(productId: string, file: File, altText: string): Promise<unknown>;
}

export interface CatalogueVariant {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: string;
  unitWeightG: number;
  active: boolean;
  available: number;
  earliestExpiry: string | null;
}

export interface CatalogueProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  basePrice: string;
  unitWeightG: number;
  ingredients: string | null;
  allergens: string | null;
  active: boolean;
  seller: { id: string; businessName: string };
  images: Array<{ id: string; url: string; altText: string }>;
  variants: CatalogueVariant[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Unexpected error';
}

export function lkr(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return `LKR ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function day(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Loads on mount and when `key` changes; late responses from older keys are dropped. */
export function useLoad<T>(loader: () => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(loader);
  const seq = useRef(0);
  ref.current = loader;
  const reload = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const next = await ref.current();
      if (mine === seq.current) {
        setData(next);
        setError(null);
      }
    } catch (e) {
      if (mine === seq.current) setError(message(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [key, reload]);
  return { data, error, loading, reload, setData };
}

export const CATEGORIES = [
  'Honey',
  'Jams & Preserves',
  'Spreads',
  'Pickles & Chutneys',
  'Spices',
  'Tea',
  'Gift Boxes',
];
