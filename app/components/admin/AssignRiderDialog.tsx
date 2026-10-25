'use client';

import { useEffect, useState } from 'react';
import { ConfirmDialog, FormField, Select, Spinner } from '@biobloom/ui';
import { adminApi, errorMessage, rowsOf } from '../../lib/admin/api';
import type { DeliveryAssignment, Rider } from '../../lib/admin/types';

/**
 * Assigns a shipped order to a rider, or re-opens a FAILED assignment for
 * another attempt (optionally with a different rider). The API keeps the
 * order SHIPPED and bumps `attempts` on a retry.
 */
export function AssignRiderDialog({
  orderId,
  orderLabel,
  current,
  onClose,
  onAssigned,
}: {
  orderId: string | null;
  orderLabel: string;
  current?: DeliveryAssignment | null;
  onClose: () => void;
  onAssigned: (message: string) => void;
}) {
  const open = orderId !== null;
  const [riders, setRiders] = useState<Rider[] | null>(null);
  const [riderId, setRiderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldError(null);
    setRiderId(current?.deliveryUser?.id ?? '');
    adminApi<Rider[]>('GET', '/api/admin/riders')
      .then((rows) => setRiders(rowsOf(rows).filter((r) => r.active)))
      .catch((e) => {
        setRiders([]);
        setError(errorMessage(e));
      });
  }, [open, current]);

  const retry = current?.status === 'FAILED';

  async function submit() {
    if (!orderId) return;
    if (!riderId) {
      setFieldError('Choose a rider.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', `/api/admin/orders/${orderId}/assign`, { deliveryUserId: riderId });
      const name = riders?.find((r) => r.id === riderId)?.name ?? 'the rider';
      onAssigned(`${orderLabel} ${retry ? 're-assigned' : 'assigned'} to ${name}.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={retry ? `Retry delivery for ${orderLabel}` : `Assign rider to ${orderLabel}`}
      description={
        retry
          ? `Attempt ${current?.attempts ?? 1} failed${
              current?.failureReason ? `: ${current.failureReason}` : ''
            }. Choose a rider for the next attempt.`
          : 'The rider is notified on their device and sees the order in their feed.'
      }
      confirmLabel={retry ? 'Re-assign' : 'Assign'}
      busyLabel="Assigning…"
      busy={busy}
      error={error}
      onCancel={onClose}
      onConfirm={submit}
    >
      {riders === null ? (
        <Spinner label="Loading riders…" />
      ) : (
        <FormField
          label="Rider"
          required
          error={fieldError ?? undefined}
          hint={riders.length === 0 ? 'No active riders. Add one on the Riders page.' : undefined}
        >
          <Select
            value={riderId}
            onChange={(e) => {
              setRiderId(e.target.value);
              setFieldError(null);
            }}
          >
            <option value="">Select a rider</option>
            {riders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.phone})
              </option>
            ))}
          </Select>
        </FormField>
      )}
    </ConfirmDialog>
  );
}
