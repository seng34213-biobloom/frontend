'use client';

import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  EmptyRow,
  FormField,
  Input,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
} from '@biobloom/ui';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { adminApi, errorMessage, rowsOf, type Paginated } from '../../lib/admin/api';
import { useAuth } from '../../lib/admin/auth-context';
import type { Rider } from '../../lib/admin/types';
import { useResource } from '../../lib/admin/use-resource';

const EMPTY = { name: '', email: '', phone: '', password: '' };

export default function RidersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const riders = useResource(
    () => adminApi<Rider[] | Paginated<Rider>>('GET', '/api/admin/riders').then(rowsOf),
    [],
  );
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi('POST', '/api/admin/riders', form);
      setNotice(`Rider ${form.name} created. They sign in to the delivery app with this email.`);
      setForm(EMPTY);
      await riders.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: Rider) {
    setError(null);
    try {
      await adminApi('PATCH', `/api/admin/riders/${r.id}`, { active: !r.active });
      await riders.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Riders" description="Delivery team accounts for the rider app." />
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {riders.error ? <Alert tone="error">{riders.error}</Alert> : null}
      {riders.loading && !riders.data ? <Spinner label="Loading riders" /> : null}
      {riders.data ? (
        <Table caption="Riders">
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              {isAdmin ? <Th align="right">Actions</Th> : null}
            </tr>
          </TableHead>
          <TableBody>
            {riders.data.length === 0 ? (
              <EmptyRow colSpan={isAdmin ? 5 : 4}>No riders yet.</EmptyRow>
            ) : (
              riders.data.map((r) => (
                <tr key={r.id}>
                  <Td>{r.name}</Td>
                  <Td>{r.email}</Td>
                  <Td>{r.phone}</Td>
                  <Td>
                    <StatusBadge
                      status={r.active ? 'ACTIVE' : 'CANCELLED'}
                      label={r.active ? 'Active' : 'Inactive'}
                    />
                  </Td>
                  {isAdmin ? (
                    <Td align="right">
                      <Button size="sm" variant="secondary" onClick={() => void toggle(r)}>
                        {r.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </Td>
                  ) : null}
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}

      {isAdmin ? (
        <form onSubmit={create} className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2" noValidate>
          <h2 className="font-serif text-xl sm:col-span-2">Add a rider</h2>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Phone" required>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField
            label="Initial password"
            required
            hint="At least 8 characters with a letter and a digit."
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create rider'}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  );
}
