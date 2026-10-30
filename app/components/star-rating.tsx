import { useTranslations } from 'next-intl';

/** Read-only star rating with a text equivalent for screen readers. */
export function StarRating({ value, size = 'text-base' }: { value: number; size?: string }) {
  const t = useTranslations('reviews');
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`}>
      <span className="sr-only">{t('ratingOutOfFive', { rating: rounded })}</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i <= Math.round(rounded) ? 'text-sky' : 'text-cream-400'}
        >
          ★
        </span>
      ))}
    </span>
  );
}
