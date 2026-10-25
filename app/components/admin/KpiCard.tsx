export type KpiTone = 'brand' | 'clay' | 'amber';

const TONE_CLASSES: Record<KpiTone, string> = {
  brand: 'border-brand-200 bg-brand-50',
  clay: 'border-clay-200 bg-clay-50',
  amber: 'border-amber-200 bg-amber-50',
};

/**
 * Dashboard KPI tile (SDS §6.5). Rendered as a description-list pair so the
 * label and value are announced together; `value` null shows a loading dash.
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = 'brand',
}: {
  label: string;
  value: string | null;
  hint?: string;
  tone?: KpiTone;
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${TONE_CLASSES[tone]}`} data-tone={tone}>
      <dt className="text-forest-600 text-xs font-semibold uppercase tracking-widest">{label}</dt>
      <dd
        className="text-forest-700 mt-2 font-serif text-3xl"
        aria-busy={value === null || undefined}
      >
        {value ?? (
          <>
            <span aria-hidden="true">…</span>
            <span className="sr-only">Loading</span>
          </>
        )}
      </dd>
      {hint ? <dd className="text-forest-500 mt-1 text-xs">{hint}</dd> : null}
    </div>
  );
}
