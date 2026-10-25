'use client';

import { ConfirmDialog as SharedConfirmDialog } from '@biobloom/ui';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation modal (WCAG 2.1.2, 3.3.4) replacing `confirm()`:
 * the shared @biobloom/ui dialog traps focus, closes on Escape and returns
 * focus to the opener.
 */
export function ConfirmDialog(props: Props) {
  return <SharedConfirmDialog {...props} tone="danger" />;
}
