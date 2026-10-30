'use client';

import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  EmptyRow,
  FormField,
  Input,
  Select,
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
import { useResource } from '../../lib/admin/use-resource';

interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'FULFILMENT_STAFF';
  active: boolean;
}

const EMPTY = { name: '', email: '', password: '', role: 'FULFILMENT_STAFF' as StaffRow['role'] };

export default function StaffPage() {
  const { user } = useAuth();
  const staff = useResource(
    () => adminApi<StaffRow[] | Paginated<StaffRow>>('GET', '/api/admin/staff').then(rowsOf),
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
      await adminApi('POST', '/api/admin/staff', form);
      setNotice(`${form.name} can now sign in to the console.`);
      setForm(EMPTY);
      await staff.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function update(row: StaffRow, patch: Partial<Pick<StaffRow, 'active' | 'role'>>) {
    setError(null);
    try {
      await adminApi('PATCH', `/api/admin/staff/${row.id}`, patch);
      await staff.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Staff accounts"
        description="Administrators and fulfilment staff (SDS §7.2 roles)."
      />
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {staff.error ? <Alert tone="error">{staff.error}</Alert> : null}
      {staff.loading && !staff.data ? <Spinner label="Loading staff" /> : null}
      {staff.data ? (
        <Table caption="Staff accounts">
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {staff.data.length === 0 ? (
              <EmptyRow colSpan={5}>No staff accounts.</EmptyRow>
            ) : (
              staff.data.map((s) => {
                const self = s.id === user?.id;
                return (
                  <tr key={s.id}>
                    <Td>
                      {s.name}
                      {self ? ' (you)' : ''}
                    </Td>
                    <Td>{s.email}</Td>
                    <Td>
                      <FormField label={`Role for ${s.name}`} hideLabel>
                        <Select
                          value={s.role}
                          disabled={self}
                          onChange={(e) =>
                            void update(s, { role: e.target.value as StaffRow['role'] })
                          }
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="FULFILMENT_STAFF">Fulfilment staff</option>
                        </Select>
                      </FormField>
                    </Td>
                    <Td>
                      <StatusBadge
                        status={s.active ? 'ACTIVE' : 'CANCELLED'}
                        label={s.active ? 'Active' : 'Inactive'}
                      />
                    </Td>
                    <Td align="right">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={self}
                        onClick={() => void update(s, { active: !s.active })}
                      >
                        {s.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </Td>
                  </tr>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : null}

      <form onSubmit={create} className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2" noValidate>
        <h2 className="font-serif text-xl sm:col-span-2">Add a staff member</h2>
        <FormField label="Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Role" required>
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as StaffRow['role'] })}
          >
            <option value="FULFILMENT_STAFF">Fulfilment staff</option>
            <option value="ADMIN">Admin</option>
          </Select>
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
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </div>
      </form>
    </>
  );
}
