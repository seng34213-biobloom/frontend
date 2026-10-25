'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Button } from '@biobloom/ui';
import { InlineAlert } from '../../components/inline-alert';
import { StarRating } from '../../components/star-rating';
import { TextAreaField } from '../../components/form-field';
import { api, isApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { currentPath, loginHref } from '../../lib/navigation';
import type { Review } from '../../lib/types';

/**
 * Customer Reviews tab (SDS §6.2, DDP-#27). Only customers with a delivered
 * order for the product can review; reviews appear after moderation.
 */
export function ReviewsSection({ productId, initial }: { productId: string; initial: Review[] }) {
  const t = useTranslations('reviews');
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 5) {
      setError(t('commentTooShort'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('POST', '/api/reviews', { productId, rating, comment: comment.trim() });
      setSubmitted(true);
      setComment('');
    } catch (err) {
      setError(isApiError(err, 403) ? t('needDelivered') : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {initial.length === 0 ? <p className="text-forest-600">{t('none')}</p> : null}
      <ul className="space-y-4">
        {initial.map((r) => (
          <li key={r.id} className="border-cream-200 rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2">
              <StarRating value={r.rating} size="text-sm" />
              <span className="text-sm font-semibold">
                {r.customer?.name?.split(' ')[0] ?? t('anonymous')}
              </span>
              <span className="text-forest-500 text-xs">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-forest-700 mt-2 whitespace-pre-line">{r.comment}</p>
          </li>
        ))}
      </ul>

      {user?.role === 'CUSTOMER' ? (
        submitted ? (
          <InlineAlert tone="success">{t('thanks')}</InlineAlert>
        ) : (
          <form
            onSubmit={submit}
            className="border-cream-200 bg-cream-50 space-y-3 rounded-2xl border p-4"
            noValidate
          >
            <h3 className="font-semibold">{t('writeHeading')}</h3>
            <fieldset>
              <legend className="text-forest-500 text-xs font-medium uppercase tracking-widest">
                {t('ratingLabel')}
              </legend>
              <div className="mt-1 flex gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      checked={rating === n}
                      onChange={() => setRating(n)}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextAreaField
              label={t('commentLabel')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={error ?? undefined}
              rows={4}
            />
            <Button type="submit" disabled={busy}>
              {busy ? t('submitting') : t('submit')}
            </Button>
          </form>
        )
      ) : (
        <p className="text-sm">
          <Link
            className="underline"
            href={loginHref(typeof window === 'undefined' ? '/' : currentPath())}
          >
            {t('signInToReview')}
          </Link>
        </p>
      )}
    </div>
  );
}
