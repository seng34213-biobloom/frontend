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
 * Customer Reviews band (SDS §6.2, DDP-#27). Only customers with a delivered
 * order for the product can review; reviews appear after moderation.
 */
export function ReviewsSection({
  productId,
  initial,
  count,
}: {
  productId: string;
  initial: Review[];
  count: number;
}) {
  const t = useTranslations('reviews');
  const tabs = useTranslations('pdp.tabs');
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
    <section aria-labelledby="reviews-h" className="mx-auto max-w-3xl space-y-6 px-7 py-10">
      <h2 id="reviews-h" className="text-lg font-medium">
        {tabs('reviews', { count })}
      </h2>
      {initial.length === 0 ? <p className="text-center">{t('none')}</p> : null}
      <ul className="divide-y divide-black border-y border-black empty:hidden">
        {initial.map((r) => (
          <li key={r.id} className="py-5">
            <div className="flex items-center gap-2">
              <StarRating value={r.rating} size="text-sm" />
              <span className="text-sm font-semibold">
                {r.customer?.name?.split(' ')[0] ?? t('anonymous')}
              </span>
              <span className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 whitespace-pre-line">{r.comment}</p>
          </li>
        ))}
      </ul>

      {user?.role === 'CUSTOMER' ? (
        submitted ? (
          <InlineAlert tone="success">{t('thanks')}</InlineAlert>
        ) : (
          <form onSubmit={submit} className="space-y-3 border border-black p-5" noValidate>
            <h3 className="font-semibold">{t('writeHeading')}</h3>
            <fieldset>
              <legend className="font-medium">{t('ratingLabel')}</legend>
              <div className="mt-1 flex gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      checked={rating === n}
                      onChange={() => setRating(n)}
                      className="accent-black"
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
        <p className="text-center">
          <Link
            className="caps font-medium underline"
            href={loginHref(typeof window === 'undefined' ? '/' : currentPath())}
          >
            {t('signInToReview')}
          </Link>
        </p>
      )}
    </section>
  );
}
