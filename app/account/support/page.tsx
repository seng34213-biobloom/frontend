'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Spinner } from '@biobloom/ui';
import { TextAreaField, TextField } from '../../components/form-field';
import { InlineAlert } from '../../components/inline-alert';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import type { SupportTicket } from '../../lib/types';
import { useRequireAuth, useSessionExpiryRedirect } from '../../lib/use-require-auth';

/** Customer support tickets (DDP-#27): open, follow and reopen resolved tickets. */
export default function SupportPage() {
  const t = useTranslations('support');
  const { ready } = useRequireAuth();
  const onAuthError = useSessionExpiryRedirect();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setTickets(await api<SupportTicket[]>('GET', '/api/support/tickets'));
    } catch (e) {
      if (!onAuthError(e)) setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (ready) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function open(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (subject.trim().length < 3 || message.trim().length < 10) {
      setError(t('formRule'));
      return;
    }
    setBusy(true);
    try {
      await api('POST', '/api/support/tickets', {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject('');
      setMessage('');
      setNotice(t('opened'));
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reopen(id: string) {
    setError(null);
    try {
      await api('POST', `/api/support/tickets/${id}/reopen`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow={t('eyebrow')} title={t('heading')} lead={t('lead')} />
      {notice ? (
        <div aria-live="polite">
          <InlineAlert tone="success">{notice}</InlineAlert>
        </div>
      ) : null}
      {error ? (
        <div role="alert">
          <InlineAlert>{error}</InlineAlert>
        </div>
      ) : null}
      <form onSubmit={open} className="space-y-3 border border-black p-7" noValidate>
        <h2 className="font-serif text-xl">{t('newTicket')}</h2>
        <TextField
          label={t('subject')}
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <TextAreaField
          label={t('message')}
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {t('send')}
        </Button>
      </form>
      {!tickets ? (
        <Spinner label={t('loading')} />
      ) : (
        <ul className="space-y-3">
          {tickets.length === 0 ? <li>{t('none')}</li> : null}
          {tickets.map((tk) => (
            <li key={tk.id} className="border border-black p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{tk.subject}</span>
                <span className="caps border border-black px-2 py-0.5 text-sm font-medium">
                  {t(`statuses.${tk.status}`)}
                </span>
              </div>
              <p className="text-forest-600 mt-2 whitespace-pre-line text-sm">{tk.message}</p>
              {tk.status === 'RESOLVED' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => void reopen(tk.id)}
                >
                  {t('reopen')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
