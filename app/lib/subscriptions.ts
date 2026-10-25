import type { Subscription, SubscriptionAction } from './types';

/** Actions offered per status (SDS §6.4). Cancelled subscriptions have none. */
export function actionsFor(status: Subscription['status']): SubscriptionAction[] {
  if (status === 'ACTIVE') return ['pause', 'skip-next', 'cancel'];
  if (status === 'PAUSED') return ['resume', 'cancel'];
  return [];
}
