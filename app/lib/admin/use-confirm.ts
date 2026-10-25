'use client';

import { useCallback, useState } from 'react';
import { errorMessage } from './api';

/**
 * State for a ConfirmDialog bound to one target row. `run` keeps the dialog
 * open and shows the API error inside it when the action fails, and closes
 * it on success.
 */
export function useConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((next: T) => {
    setTarget(next);
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (busy) return;
    setTarget(null);
    setError(null);
  }, [busy]);

  const run = useCallback(
    async (action: (current: T) => Promise<void>) => {
      if (target === null) return;
      setBusy(true);
      setError(null);
      try {
        await action(target);
        setTarget(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [target],
  );

  return { target, isOpen: target !== null, busy, error, setError, open, close, run };
}
