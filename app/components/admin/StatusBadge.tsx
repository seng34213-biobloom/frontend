import { Badge, type BadgeTone } from '@biobloom/ui';
import { humanize } from '../../lib/admin/format';

/*
 * One colour vocabulary for every workflow status in the console. The badge
 * text always names the status, so colour is never the only cue (WCAG 1.4.1).
 */
const TONES: Record<string, BadgeTone> = {
  // Batches (SDS §6.6: red expired, amber expiring, green active)
  ACTIVE: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'danger',
  DEPLETED: 'neutral',
  // Orders
  PENDING_PAYMENT: 'neutral',
  PAID: 'info',
  PACKING: 'warning',
  SHIPPED: 'accent',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
  // Payments
  PENDING: 'neutral',
  FAILED: 'danger',
  PARTIALLY_REFUNDED: 'warning',
  // Delivery assignments
  ASSIGNED: 'info',
  PICKED_UP: 'accent',
  OUT_FOR_DELIVERY: 'warning',
  // Refund requests
  REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  PROCESSED: 'success',
  // Subscriptions, sellers, tickets
  PAUSED: 'warning',
  SUSPENDED: 'danger',
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export function statusTone(status: string): BadgeTone {
  return TONES[status] ?? 'neutral';
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={statusTone(status)}>{label ?? humanize(status)}</Badge>;
}
