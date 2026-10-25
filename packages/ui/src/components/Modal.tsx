import * as React from 'react';
import { createPortal } from 'react-dom';
import { Alert } from './Alert';
import { Button } from './Button';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Element to focus when the dialog opens; defaults to the first focusable control. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Block Escape while a request is in flight. */
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Modal dialog (WAI-ARIA dialog pattern): `role="dialog"` with
 * `aria-modal="true"`, labelled by its title, focus moved inside on open,
 * Tab / Shift+Tab trapped within the panel, Escape closes, and focus is
 * returned to the triggering element on close (WCAG 2.1.2, 2.4.3).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  dismissible = true,
  size = 'md',
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const generated = React.useId().replace(/:/g, '');
  const titleId = `modal-${generated}-title`;
  const descId = description ? `modal-${generated}-desc` : undefined;

  // Keep the latest callbacks without re-running the focus effect each render.
  const onCloseRef = React.useRef(onClose);
  const dismissibleRef = React.useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  React.useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const target = initialFocusRef?.current ?? focusableIn(panel)[0] ?? panel;
      target.focus();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      const root = panelRef.current;
      if (!root) return;
      if (event.key === 'Escape') {
        if (dismissibleRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableIn(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [open, initialFocusRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="bg-forest-700/50 absolute inset-0" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={`border-cream-300 bg-cream-50 relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border p-6 shadow-xl ${sizeClasses[size]}`}
      >
        <h2 id={titleId} className="text-forest-700 text-lg font-bold">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="text-forest-500 mt-1 text-sm">
            {description}
          </div>
        ) : null}
        {children ? <div className="mt-4 space-y-4">{children}</div> : null}
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra fields (e.g. a reason textarea) rendered between text and buttons. */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  /** Server or validation error shown inside the dialog. */
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Accessible replacement for `window.confirm()` / `window.prompt()`. The
 * body is a form, so Enter in a field confirms. Focus starts on Cancel so a
 * stray Enter never triggers a destructive action.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busyLabel = 'Working…',
  tone = 'primary',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      dismissible={!busy}
      initialFocusRef={children ? undefined : cancelRef}
      size="sm"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm();
        }}
      >
        {children}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            disabled={busy}
            aria-busy={busy || undefined}
          >
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
