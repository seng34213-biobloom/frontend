import { Badge, type BadgeTone } from '@biobloom/ui';

export type BatchStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'DEPLETED';

/**
 * SDS §6.6 colour coding: red for expired, amber for fewer than seven days
 * remaining, green for active. Depleted batches are neutral. The label is
 * always spelled out so the status never relies on colour alone.
 */
export const BATCH_STATUS: Record<BatchStatus, { tone: BadgeTone; label: string }> = {
  ACTIVE: { tone: 'success', label: 'Active' },
  EXPIRING_SOON: { tone: 'warning', label: 'Expiring soon' },
  EXPIRED: { tone: 'danger', label: 'Expired' },
  DEPLETED: { tone: 'neutral', label: 'Depleted' },
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const meta = BATCH_STATUS[status] ?? { tone: 'neutral' as const, label: status };
  return (
    <Badge tone={meta.tone} data-status={status}>
      {meta.label}
    </Badge>
  );
}
