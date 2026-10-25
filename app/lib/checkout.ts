import type { PaymentCheckout } from './types';

/** Follow the gateway's hosted checkout: a redirect, or an auto-submitted form (PayHere). */
export function goToCheckout(checkout: PaymentCheckout): void {
  if (checkout.method === 'REDIRECT') {
    window.location.assign(checkout.url);
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkout.url;
  for (const [name, value] of Object.entries(checkout.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
