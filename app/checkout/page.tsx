'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/button';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface Quote {
  subtotal: string;
  shippingFee: string;
  total: string;
  totalWeightG: number;
  shippingBracket?: string;
}

interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CheckoutResult {
  order: {
    id: string;
    status: string;
    totalAmount: string;
    shippingFee: string;
    totalWeightG: number;
    currency: string;
  };
  payment: {
    gateway: 'STRIPE' | 'PAYHERE';
    gatewayPaymentId: string;
    clientSecret: string;
  };
}

interface SubscriptionVariant {
  id: string;
  sku: string;
  name: string;
  size: string;
  price: string;
  unitWeightG: number;
  productName: string;
  productSlug: string;
}

interface SubscriptionResult {
  id: string;
  status: string;
  frequencyDays: number;
  quantity: number;
  nextBillingDate: string;
}

const emptyAddressForm = {
  line1: '',
  line2: '',
  city: '',
  district: '',
  postalCode: '',
};

const SUBSCRIBE_DISCOUNT_RATE = 0.1; // 10% — matches API DEFAULT_DISCOUNT_RATE

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const isSubscribeMode = params.get('subscribe') === '1';
  const subSlug = params.get('slug') ?? '';
  const subVariantId = params.get('variantId') ?? '';
  const subFrequency = Number(params.get('frequency') ?? '30');
  const subQuantity = Math.max(1, Number(params.get('quantity') ?? '1'));

  const [quote, setQuote] = useState<Quote | null>(null);
  const [subVariant, setSubVariant] = useState<SubscriptionVariant | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingAddressId, setShippingAddressId] = useState<string>('');
  const [gateway, setGateway] = useState<'STRIPE' | 'PAYHERE'>('STRIPE');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [subResult, setSubResult] = useState<SubscriptionResult | null>(null);

  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ ...emptyAddressForm });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/checkout' + (isSubscribeMode ? `?${params.toString()}` : ''))}`);
      return;
    }
    void (async () => {
      try {
        const addrs = await api<Address[]>('GET', '/api/addresses');
        setAddresses(addrs);
        const preferred = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (preferred) {
          setShippingAddressId(preferred.id);
        } else {
          setShowNewAddress(true);
        }

        if (isSubscribeMode && subSlug && subVariantId) {
          // Subscription mode — fetch the product, locate the variant.
          interface ProductDetail {
            slug: string;
            name: string;
            variants: Array<{
              id: string;
              sku: string;
              name: string;
              size: string;
              price: string;
              unitWeightG: number;
            }>;
          }
          const product = await api<ProductDetail>('GET', `/api/products/${encodeURIComponent(subSlug)}`);
          const variant = product.variants.find((v) => v.id === subVariantId);
          if (!variant) {
            setError('That product variant is no longer available.');
            return;
          }
          setSubVariant({
            ...variant,
            productName: product.name,
            productSlug: product.slug,
          });
        } else {
          // Standard one-shot order — cart-derived quote.
          const q = await api<Quote>('GET', '/api/checkout/quote');
          setQuote(q);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          router.push('/login?next=/checkout');
          return;
        }
        setError((e as Error).message);
      }
    })();
  }, [authLoading, user, router, isSubscribeMode, subSlug, subVariantId, params]);

  const subQuote = useMemo(() => {
    if (!subVariant) return null;
    const baseSubtotal = Number(subVariant.price) * subQuantity;
    const discount = baseSubtotal * SUBSCRIBE_DISCOUNT_RATE;
    const subtotal = baseSubtotal - discount;
    const totalWeightG = subVariant.unitWeightG * subQuantity;
    return {
      baseSubtotal,
      discount,
      subtotal,
      totalWeightG,
    };
  }, [subVariant, subQuantity]);

  async function saveNewAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavingAddress(true);
    try {
      const created = await api<Address>('POST', '/api/addresses', {
        line1: newAddress.line1.trim(),
        line2: newAddress.line2.trim() || undefined,
        city: newAddress.city.trim(),
        district: newAddress.district.trim(),
        postalCode: newAddress.postalCode.trim(),
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev.map((a) => ({ ...a, isDefault: false }))]);
      setShippingAddressId(created.id);
      setNewAddress({ ...emptyAddressForm });
      setShowNewAddress(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function submit() {
    if (!shippingAddressId) {
      setError('Choose a shipping address');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isSubscribeMode) {
        if (!subVariant) {
          setError('Subscription details missing. Go back to the product page and try again.');
          return;
        }
        // SDS §7.3 — the gateway returns a tokenized payment method; the
        // API encrypts and stores it. Until Stripe.js / PayHere Elements
        // are wired (Phase 13), we send a deterministic dev token so the
        // backend's pgcrypto path is still exercised.
        const paymentToken = `dev_${gateway.toLowerCase()}_${subVariant.id.slice(0, 8)}_${Date.now()}`;
        const out = await api<SubscriptionResult>('POST', '/api/subscriptions', {
          productVariantId: subVariant.id,
          shippingAddressId,
          frequencyDays: subFrequency,
          quantity: subQuantity,
          paymentToken,
          paymentGateway: gateway,
        });
        setSubResult(out);
      } else {
        const out = await api<CheckoutResult>('POST', '/api/checkout', {
          shippingAddressId,
          gateway,
        });
        setResult(out);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (subResult) {
    const next = new Date(subResult.nextBillingDate);
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl animate-fade-up flex-col gap-6 px-6 py-12">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700 shadow-sm"
        >
          ✓
        </span>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
          Subscription started
        </span>
        <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">You're all set!</h1>
        <p className="text-lg leading-relaxed text-forest-500">
          Subscription <code className="rounded bg-cream-100 px-1.5 py-0.5 font-mono text-sm text-forest-700">{subResult.id}</code> is now{' '}
          <strong className="font-semibold text-forest-700">{subResult.status}</strong>. We'll bill your {gateway} on{' '}
          <strong>{next.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>{' '}
          and every {subResult.frequencyDays} days after.
        </p>
        <div className="flex gap-3">
          <Button>
            <Link href="/account/subscriptions">Manage subscriptions</Link>
          </Button>
          <Button variant="secondary">
            <Link href="/products">Keep shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl animate-fade-up flex-col gap-6 px-6 py-12">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700 shadow-sm"
        >
          ✓
        </span>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
          Order created
        </span>
        <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">Almost there!</h1>
        <p className="text-lg leading-relaxed text-forest-500">
          Order <code className="rounded bg-cream-100 px-1.5 py-0.5 font-mono text-sm text-forest-700">{result.order.id}</code> is now in{' '}
          <strong className="font-semibold text-forest-700">{result.order.status}</strong>. Pay using the {result.payment.gateway} client
          secret below — once the payment webhook confirms, your order will move to PAID.
        </p>
        <dl className="space-y-3 rounded-2xl border border-cream-200 bg-cream-50 p-6 text-sm shadow-sm">
          <div className="flex justify-between">
            <dt className="text-forest-500">Total</dt>
            <dd className="font-semibold text-forest-700">LKR {result.order.totalAmount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-forest-500">Shipping</dt>
            <dd>LKR {result.order.shippingFee}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-forest-500">Weight</dt>
            <dd>{result.order.totalWeightG} g</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-forest-500">Payment intent</dt>
            <dd className="font-mono text-xs">{result.payment.gatewayPaymentId}</dd>
          </div>
        </dl>
        <Button>
          <Link href="/account/orders">View my orders</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-clay-500">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {isSubscribeMode ? 'Subscribe & Save' : 'Step 2 of 2'}
        </span>
        <h1 className="font-serif text-4xl text-forest-700 md:text-5xl">
          {isSubscribeMode ? 'Start your subscription' : 'Pay & place order'}
        </h1>
        {user && <p className="text-forest-500">Logged in as {user.email}</p>}
      </header>

      {error && (
        <div className="animate-pop-in rounded-2xl border border-danger-500 bg-danger-100 p-4 text-sm font-medium text-danger-700">
          {error}
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-forest-700">
          {isSubscribeMode ? 'Subscription summary' : 'Order summary'}
        </h2>
        {isSubscribeMode ? (
          subVariant && subQuote ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-forest-500">
                  <strong className="font-semibold text-forest-700">{subVariant.productName}</strong> ·{' '}
                  {subVariant.size} × {subQuantity}
                </dt>
                <dd>LKR {subQuote.baseSubtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-brand-700">
                <dt>Subscribe &amp; Save 10%</dt>
                <dd>− LKR {subQuote.discount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-forest-500">First charge today</dt>
                <dd className="font-medium text-forest-700">LKR {subQuote.subtotal.toFixed(2)}</dd>
              </div>
              <div className="border-t border-cream-300 pt-2 text-xs text-forest-500">
                Then LKR {subQuote.subtotal.toFixed(2)} every {subFrequency} days. Shipping is added per delivery
                ({subQuote.totalWeightG} g per parcel). Pause or cancel anytime from your account.
              </div>
            </dl>
          ) : (
            <p className="text-forest-400">Loading subscription details…</p>
          )
        ) : quote ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-forest-500">Subtotal</dt>
              <dd>LKR {quote.subtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-forest-500">
                Shipping ({quote.totalWeightG} g
                {quote.shippingBracket ? ` · ${quote.shippingBracket}` : ''})
              </dt>
              <dd>LKR {quote.shippingFee}</dd>
            </div>
            <div className="flex justify-between border-t border-cream-300 pt-2 text-lg">
              <dt className="font-medium text-forest-700">Total</dt>
              <dd className="text-xl font-bold tracking-tight text-forest-700">LKR {quote.total}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-forest-400">Loading quote…</p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-forest-700">Shipping address</h2>
          {addresses.length > 0 && !showNewAddress && (
            <button
              type="button"
              onClick={() => setShowNewAddress(true)}
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              + Add another address
            </button>
          )}
        </div>

        {addresses.length > 0 && (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 text-sm transition-all duration-200 ease-soft hover:border-brand-400 hover:bg-cream-100 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                  <input
                    type="radio"
                    name="shippingAddressId"
                    value={a.id}
                    checked={shippingAddressId === a.id}
                    onChange={() => setShippingAddressId(a.id)}
                    className="mt-1 h-4 w-4 text-brand-600"
                  />
                  <span className="flex-1">
                    <span className="block text-forest-700">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}
                    </span>
                    <span className="block text-xs text-forest-500">
                      {a.city}, {a.district} {a.postalCode} · {a.country}
                    </span>
                  </span>
                  {a.isDefault && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Default
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        {(showNewAddress || addresses.length === 0) && (
          <form
            onSubmit={saveNewAddress}
            className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-5"
          >
            <h3 className="font-medium text-forest-700">
              {addresses.length === 0 ? 'Add a shipping address' : 'New address'}
            </h3>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                Address line 1
              </span>
              <input
                type="text"
                required
                value={newAddress.line1}
                onChange={(e) =>
                  setNewAddress((s) => ({ ...s, line1: e.target.value }))
                }
                placeholder="House number & street"
                className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                Address line 2 (optional)
              </span>
              <input
                type="text"
                value={newAddress.line2}
                onChange={(e) =>
                  setNewAddress((s) => ({ ...s, line2: e.target.value }))
                }
                placeholder="Apartment, suite, landmark"
                className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                  City
                </span>
                <input
                  type="text"
                  required
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((s) => ({ ...s, city: e.target.value }))
                  }
                  className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                  District
                </span>
                <input
                  type="text"
                  required
                  value={newAddress.district}
                  onChange={(e) =>
                    setNewAddress((s) => ({ ...s, district: e.target.value }))
                  }
                  className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-widest text-forest-500">
                  Postal code
                </span>
                <input
                  type="text"
                  required
                  value={newAddress.postalCode}
                  onChange={(e) =>
                    setNewAddress((s) => ({ ...s, postalCode: e.target.value }))
                  }
                  className="mt-1.5 block w-full rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-forest-700 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={savingAddress}>
                {savingAddress ? 'Saving…' : 'Save address'}
              </Button>
              {addresses.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowNewAddress(false);
                    setNewAddress({ ...emptyAddressForm });
                  }}
                  disabled={savingAddress}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-forest-700">Payment method</h2>
        <div className="flex gap-3">
          {(['STRIPE', 'PAYHERE'] as const).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGateway(g)}
              aria-pressed={gateway === g}
              className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-soft active:scale-[0.98] ${gateway === g
                  ? 'border-brand-600 bg-brand-600 text-cream-50 shadow-sm'
                  : 'border-cream-300 bg-cream-50 text-forest-600 hover:border-brand-400 hover:bg-cream-100'
                }`}
            >
              {g === 'STRIPE' ? 'Card (Stripe)' : 'PayHere (LKR)'}
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={
            submitting ||
            !shippingAddressId ||
            (isSubscribeMode ? !subQuote : !quote)
          }
          className="w-full px-6 py-3.5 text-base sm:w-auto"
        >
          {submitting
            ? isSubscribeMode
              ? 'Starting subscription…'
              : 'Placing order…'
            : isSubscribeMode
              ? `Start subscription — LKR ${subQuote?.subtotal.toFixed(2) ?? '…'}/cycle`
              : `Place order — LKR ${quote?.total ?? '…'}`}
        </Button>
      </div>
    </main>
  );
}
