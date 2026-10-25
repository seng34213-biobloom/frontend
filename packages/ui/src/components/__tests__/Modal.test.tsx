import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, Modal } from '../Modal';
import { Button } from '../Button';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        title="Edit batch"
        description="Change the batch details."
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <label htmlFor="name">Name</label>
        <input id="name" />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is an aria-modal dialog labelled by its title and description', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit batch' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Change the batch details.');
  });

  it('moves focus inside on open and traps Tab within the panel', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    const input = screen.getByLabelText('Name');
    const done = screen.getByRole('button', { name: 'Done' });
    expect(input).toHaveFocus();
    await userEvent.tab();
    expect(done).toHaveFocus();
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(done).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});

describe('ConfirmDialog', () => {
  it('focuses Cancel first and calls onConfirm when confirmed', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Approve seller?"
        confirmLabel="Approve"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows the error inside the dialog and disables actions while busy', () => {
    render(
      <ConfirmDialog
        open
        busy
        title="Cancel order?"
        error="Order already shipped"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Order already shipped');
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  });

  it('ignores Escape while busy', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open busy title="Deleting" onConfirm={() => undefined} onCancel={onCancel} />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
