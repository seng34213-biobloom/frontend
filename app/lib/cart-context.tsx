'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, isApiError } from './api';
import { useAuth } from './auth-context';
import { loginHref } from './navigation';
import type { CartView } from './types';

export type CartItemInput =
  { productVariantId: string; quantity: number } | { bundleId: string; quantity: number };

interface CartContextValue {
  cart: CartView | null;
  count: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Stores a cart the caller already fetched, so the header count stays current. */
  setCart: (cart: CartView) => void;
  /**
   * Adds an item and opens the drawer. Sends anonymous visitors to sign in,
   * returning them to `returnTo`. Resolves false when they were redirected.
   */
  addItem: (input: CartItemInput, returnTo: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  count: 0,
  drawerOpen: false,
  openDrawer: () => undefined,
  closeDrawer: () => undefined,
  setCart: () => undefined,
  addItem: async () => false,
});

export function useCart() {
  return useContext(CartContext);
}

/** Cart shared by the header count, the slide-over drawer and add-to-cart buttons. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState<CartView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const customer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!customer) {
      setCart(null);
      return;
    }
    let live = true;
    api<CartView>('GET', '/api/cart').then(
      (next) => {
        if (live) setCart(next);
      },
      () => undefined,
    );
    return () => {
      live = false;
    };
    // Re-read on navigation so checkout emptying the cart reaches the header.
  }, [customer, pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback(
    async (input: CartItemInput, returnTo: string) => {
      if (!user) {
        router.push(loginHref(returnTo));
        return false;
      }
      try {
        const next = await api<CartView>('POST', '/api/cart/items', input);
        setCart(next?.items ? next : await api<CartView>('GET', '/api/cart'));
        setDrawerOpen(true);
        return true;
      } catch (e) {
        if (isApiError(e, 401)) {
          router.push(loginHref(returnTo));
          return false;
        }
        throw e;
      }
    },
    [user, router],
  );

  const value = useMemo(
    () => ({
      cart,
      count: cart?.itemCount ?? 0,
      drawerOpen,
      openDrawer,
      closeDrawer,
      setCart,
      addItem,
    }),
    [cart, drawerOpen, openDrawer, closeDrawer, addItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
