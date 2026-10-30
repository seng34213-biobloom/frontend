'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { AddressForm } from '../components/address-form';
import { InlineAlert } from '../components/inline-alert';
import { PageHeader } from '../components/page-header';
import { api, isApiError } from '../lib/api';
import { discountCents, fromCents, toCents } from '../lib/money';
import { goToCheckout } from '../lib/checkout';
import type {
  Address,
  CheckoutResult,
  Gateway,
  PaymentCheckout,
  Quote,
  Subscription,
} from '../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../lib/use-require-auth';

function AddressPicker({
  addresses,
  value,
  onChange,
  onAdded,
}: {
  addresses: Address[];
  value: string;
  onChange: (id: string) => void;
  onAdded: (a: Address) => void;
}) {
  const t = useTranslations('checkout');
  const [adding, setAdding] = useState(addresses.length === 0);
  return (
    <section aria-labelledby="addr-h" className="space-y-3">
      <h2 id="addr-h" className="font-serif text-xl">
        {t('shippingAddress')}
      </h2>
      {addresses.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">{t('addressChoose')}</legend>
          {addresses.map((a) => (
            <label key={a.id} className="flex items-start gap-3 border border-black p-4">
              <input
                type="radio"
                name="address"
                value={a.id}
                checked={value === a.id}
                onChange={() => onChange(a.id)}
                className="mt-1"
              />
              <span className="text-sm">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.district} {a.postalCode}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {adding ? (
        <AddressForm
          makeDefault={addresses.length === 0}
          onSaved={(a) => {
            onAdded(a);
            setAdding(false);
          }}
        />
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          {t('addAddress')}
        </Button>
      )}
    </section>
  );
}

function GatewayPicker({ value, onChange }: { value: Gateway; onChange: (g: Gateway) => void }) {
  const t = useTranslations('checkout');
  return (
    <fieldset className="space-y-2">
      <legend className="font-serif text-xl">{t('paymentMethod')}</legend>
      {(['STRIPE', 'PAYHERE'] as const).map((g) => (
        <label key={g} className="flex items-center gap-3 border border-black p-4">
          <input
            type="radio"
            name="gateway"
            value={g}
            checked={value === g}
            onChange={() => onChange(g)}
          />
          {g === 'STRIPE' ? t('gatewayStripe') : t('gatewayPayHere')}
        </label>
      ))}
    </fieldset>
  );
}

function OrderCheckout() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const onAuthError = useSessionExpiryRedirect();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState('');
  const [gateway, setGateway] = useState<Gateway>('STRIPE');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadQuote = useCallback(async (code: string | null) => {
    const q = await api<Quote>(
      'GET',
      `/api/checkout/quote${code ? `?promoCode=${encodeURIComponent(code)}` : ''}`,
    );
    setQuote(q);
    return q;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const list = await api<Address[]>('GET', '/api/addresses');
        setAddresses(list);
        setAddressId((list.find((a) => a.isDefault) ?? list[0])?.id ?? '');
        const q = await loadQuote(null);
        if (q.totalWeightG === 0) router.replace('/cart');
      } catch (e) {
        if (!onAuthError(e)) setError((e as Error).message);
      }
    })();
  }, [loadQuote, onAuthError, router]);

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim();
    try {
      await loadQuote(code || null);
      setPromo(code || null);
    } catch (e) {
      setPromoError((e as Error).message);
      await loadQuote(promo).catch(() => undefined);
    }
  }

  async function placeOrder() {
    if (!addressId) {
      setError(t('errorChooseAddress'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api<CheckoutResult>('POST', '/api/checkout', {
        shippingAddressId: addressId,
        gateway,
        ...(promo ? { promoCode: promo } : {}),
      });
      goToCheckout(result.payment.checkout);
    } catch (e) {
      if (onAuthError(e)) return;
      if (isApiError(e, 409)) {
        // Stock changed since the cart was loaded: send the customer back to fix the line.
        setError(t('stockChanged', { message: (e as Error).message }));
        await loadQuote(promo).catch(() => undefined);
      } else {
        setError((e as Error).message);
      }
      setBusy(false);
    }
  }

  if (!addresses || !quote) return <Spinner label={t('loading')} className="p-7" />;

  return (
    <div className="grid lg:grid-cols-[2fr_1fr]">
      <div className="space-y-8 p-7 lg:border-r lg:border-black">
        <AddressPicker
          addresses={addresses}
          value={addressId}
          onChange={setAddressId}
          onAdded={(a) => {
            setAddresses([...addresses, a]);
            setAddressId(a.id);
          }}
        />
        <GatewayPicker value={gateway} onChange={setGateway} />
      </div>
      <aside className="space-y-4 border-t border-black p-7 lg:border-t-0" aria-labelledby="sum-h">
        <h2 id="sum-h" className="font-serif text-xl">
          {t('summary')}
        </h2>
        <dl className="grid grid-cols-2 gap-2">
          <dt>{t('subtotal')}</dt>
          <dd className="text-right">LKR {quote.subtotal}</dd>
          {Number(quote.discount ?? 0) > 0 ? (
            <>
              <dt>{t('discount', { code: quote.promoCode ?? '' })}</dt>
              <dd className="text-right">− LKR {quote.discount}</dd>
            </>
          ) : null}
          <dt>
            {t('shippingLine', {
              bracket: quote.bracket ?? quote.shippingBracket ?? '',
              weight: quote.totalWeightG,
            })}
          </dt>
          <dd className="text-right">LKR {quote.shippingFee}</dd>
          <dt className="text-base font-semibold">{t('total')}</dt>
          <dd className="text-right text-base font-semibold">LKR {quote.total}</dd>
        </dl>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void applyPromo();
          }}
        >
          <label className="flex-1 font-medium">
            {t('promoLabel')}
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              aria-describedby={promoError ? 'promo-err' : undefined}
              aria-invalid={Boolean(promoError) || undefined}
              className="mt-1 block w-full border border-black bg-white px-4 py-3 font-normal"
            />
          </label>
          <Button type="submit" variant="secondary">
            {t('applyPromo')}
          </Button>
        </form>
        {promoError ? (
          <p id="promo-err" role="alert" className="text-danger-700 text-sm font-medium">
            {promoError}
          </p>
        ) : null}
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <Button className="w-full" disabled={busy} onClick={() => void placeOrder()}>
          {busy ? t('placingOrder') : t('placeOrder', { total: `LKR ${quote.total}` })}
        </Button>
        <p className="text-forest-500 text-xs">{t('hostedNote')}</p>
        <Link href="/cart" className="block text-sm underline">
          {t('backToCart')}
        </Link>
      </aside>
    </div>
  );
}

function SubscribeCheckout() {
  const t = useTranslations('checkout');
  const params = useSearchParams();
  const onAuthError = useSessionExpiryRedirect();
  const variantId = params.get('variantId') ?? '';
  const quantity = Math.max(1, Math.min(10, Number(params.get('quantity') ?? 1)));
  const frequency = Number(params.get('frequency') ?? 30);
  const name = params.get('name') ?? '';
  const price = params.get('price') ?? '0';
  const setupSession = params.get('setup_session');
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState(params.get('addressId') ?? '');
  const [gateway, setGateway] = useState<Gateway>((params.get('gateway') as Gateway) || 'STRIPE');
  const [created, setCreated] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unitCents = toCents(price);
  const discounted = unitCents - discountCents(unitCents, '0.10');

  const create = useCallback(
    async (paymentToken: string, address: string, gw: Gateway) => {
      const sub = await api<Subscription>('POST', '/api/subscriptions', {
        productVariantId: variantId,
        shippingAddressId: address,
        frequencyDays: frequency,
        quantity,
        paymentToken,
        paymentGateway: gw,
      });
      setCreated(sub);
    },
    [variantId, frequency, quantity],
  );

  useEffect(() => {
    void (async () => {
      try {
        const list = await api<Address[]>('GET', '/api/addresses');
        setAddresses(list);
        setAddressId(
          (current) => current || ((list.find((a) => a.isDefault) ?? list[0])?.id ?? ''),
        );
        if (setupSession) {
          // Back from the gateway's card-saving page.
          setBusy(true);
          const { paymentToken } = await api<{ paymentToken: string }>(
            'POST',
            '/api/payments/setup/complete',
            {
              gateway,
              sessionId: setupSession,
            },
          );
          await create(paymentToken, params.get('addressId') ?? '', gateway);
        }
      } catch (e) {
        if (!onAuthError(e)) setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    })();
    // Runs once on arrival (and once on return from the gateway).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    if (!addressId) {
      setError(t('errorChooseAddress'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('addressId', addressId);
      returnUrl.searchParams.set('gateway', gateway);
      returnUrl.searchParams.delete('setup_session');
      const setup = await api<{ paymentToken?: string; checkout?: PaymentCheckout }>(
        'POST',
        '/api/payments/setup',
        {
          gateway,
          returnUrl: returnUrl.toString(),
        },
      );
      if (setup.paymentToken) {
        await create(setup.paymentToken, addressId, gateway);
      } else if (setup.checkout) {
        goToCheckout(setup.checkout);
        return;
      }
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="bg-sun band space-y-4 p-7" aria-live="polite">
        <h2 className="text-2xl font-semibold">{t('subscriptionCreated')}</h2>
        <p>
          {created.quantity} × {created.product?.name} ({created.variant?.size}) ·{' '}
          {t('everyDays', { days: created.frequencyDays })}
        </p>
        <p>
          {t('discountedPrice', {
            price: created.discountedUnitPrice ?? '',
            percent: Math.round(Number(created.discountRate) * 100),
          })}
        </p>
        <p className="font-semibold">
          {t('noChargeToday', { date: new Date(created.nextBillingDate).toLocaleDateString() })}
        </p>
        <Link href="/account/subscriptions" className="underline">
          {t('manageSubscriptions')}
        </Link>
      </section>
    );
  }

  if (!addresses) return <Spinner label={t('loading')} className="p-7" />;

  return (
    <div className="grid lg:grid-cols-[2fr_1fr]">
      <div className="space-y-8 p-7 lg:border-r lg:border-black">
        <AddressPicker
          addresses={addresses}
          value={addressId}
          onChange={setAddressId}
          onAdded={(a) => {
            setAddresses([...addresses, a]);
            setAddressId(a.id);
          }}
        />
        <GatewayPicker value={gateway} onChange={setGateway} />
      </div>
      <aside className="space-y-4 border-t border-black p-7 lg:border-t-0" aria-labelledby="sub-h">
        <h2 id="sub-h" className="font-serif text-xl">
          {t('subscriptionSummary')}
        </h2>
        <p className="text-sm">
          {quantity} × {name}
        </p>
        <dl className="grid grid-cols-2 gap-2">
          <dt>{t('everyLabel')}</dt>
          <dd className="text-right">{t('everyDays', { days: frequency })}</dd>
          <dt>{t('listPrice')}</dt>
          <dd className="text-right">LKR {fromCents(unitCents * quantity)}</dd>
          <dt>{t('subscribeDiscount')}</dt>
          <dd className="text-right">− LKR {fromCents((unitCents - discounted) * quantity)}</dd>
          <dt className="font-semibold">{t('perDelivery')}</dt>
          <dd className="text-right font-semibold">LKR {fromCents(discounted * quantity)}</dd>
        </dl>
        <p className="bg-sun border border-black p-4 text-sm font-medium">
          {t('noChargeTodayLead', { days: frequency })}
        </p>
        {error ? <InlineAlert>{error}</InlineAlert> : null}
        <Button className="w-full" disabled={busy || !variantId} onClick={() => void confirm()}>
          {busy ? t('placingOrder') : t('startSubscription')}
        </Button>
      </aside>
    </div>
  );
}

function CheckoutInner() {
  const t = useTranslations('checkout');
  const params = useSearchParams();
  const { ready } = useRequireAuth();
  const subscribe = params.get('subscribe') === '1';
  return (
    <div>
      <PageHeader
        eyebrow={t('stepIndicator')}
        title={subscribe ? t('subscribeHeading') : t('heading')}
      />
      {!ready ? (
        <Spinner label={t('loading')} className="p-7" />
      ) : subscribe ? (
        <SubscribeCheckout />
      ) : (
        <OrderCheckout />
      )}
    </div>
  );
}

/** Step 2 of 2 (SDS §6.3): address, payment method, totals with the shipping fee, then pay. */
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
