import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkbox, FormField, Input, Select, Textarea } from '../FormField';

describe('FormField', () => {
  it('associates the label with the control', () => {
    render(
      <FormField label="Batch number">
        <Input name="batchNumber" />
      </FormField>,
    );
    expect(screen.getByLabelText('Batch number')).toHaveAttribute('name', 'batchNumber');
  });

  it('links the hint through aria-describedby', () => {
    render(
      <FormField label="Password" hint="At least 8 characters with a letter and a digit.">
        <Input type="password" />
      </FormField>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAccessibleDescription('At least 8 characters with a letter and a digit.');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control invalid and links the error text (WCAG 3.3.1)', () => {
    render(
      <FormField
        label="Expiry"
        hint="Must be in the future."
        error="expiryDate must be in the future"
      >
        <Input type="date" />
      </FormField>,
    );
    const input = screen.getByLabelText('Expiry');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Must be in the future. Error: expiryDate must be in the future',
    );
  });

  it('propagates required to the control and keeps the asterisk decorative', () => {
    render(
      <FormField label="Reason" required>
        <Textarea />
      </FormField>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Reason' });
    expect(textarea).toBeRequired();
  });

  it('works for selects and respects an explicit id', () => {
    render(
      <FormField label="Status" id="status-filter">
        <Select>
          <option value="">All</option>
          <option value="PAID">Paid</option>
        </Select>
      </FormField>,
    );
    const select = screen.getByRole('combobox', { name: 'Status' });
    expect(select).toHaveAttribute('id', 'status-filter');
  });

  it('renders standalone controls without a field context', () => {
    render(<Input aria-label="Search" />);
    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveAttribute('aria-invalid');
  });
});

describe('Checkbox', () => {
  it('has its own label and hint', () => {
    render(
      <Checkbox label="Restock unexpired batches" hint="Expired batches are never restocked." />,
    );
    const box = screen.getByRole('checkbox', { name: 'Restock unexpired batches' });
    expect(box).toHaveAccessibleDescription('Expired batches are never restocked.');
  });
});
