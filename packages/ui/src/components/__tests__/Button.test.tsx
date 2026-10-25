import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';
import { LinkButton } from '../LinkButton';

describe('Button', () => {
  it('renders a native button and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps a visible focus ring for keyboard users (WCAG 2.4.7)', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button', { name: 'Focus me' });
    expect(button.className).toContain('focus-visible:ring-2');
    expect(button.className).toContain('focus-visible:ring-offset-2');
  });

  it('gives disabled buttons an outline instead of fading them (WCAG 1.4.11)', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:outline-dashed');
    expect(button.className).toContain('disabled:outline-forest-400');
    expect(button.className).not.toContain('disabled:opacity-50');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the requested variant', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-danger-700');
  });

  it('forwards refs to the underlying element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('LinkButton', () => {
  it('renders a link (not a link inside a button) with button styling', () => {
    render(<LinkButton href="/products">Shop</LinkButton>);
    const link = screen.getByRole('link', { name: 'Shop' });
    expect(link).toHaveAttribute('href', '/products');
    expect(link.closest('button')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(link.className).toContain('rounded-full');
  });
});
