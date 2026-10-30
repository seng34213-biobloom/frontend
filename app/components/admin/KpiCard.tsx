export type KpiTone = 'brand' | 'clay' | 'amber';

const TONE_CLASSES: Record<KpiTone, string> = {
  brand: 'bg-leaf',
  clay: 'bg-tangerine',
  amber: 'bg-sun',
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
    <div className={`border border-black p-5 ${TONE_CLASSES[tone]}`} data-tone={tone}>
      <dt className="caps text-xs font-semibold">{label}</dt>
      <dd className="mt-2 font-serif text-3xl" aria-busy={value === null || undefined}>
        {value ?? (
          <>
            <span aria-hidden="true">…</span>
            <span className="sr-only">Loading</span>
          </>
        )}
      </dd>
      {hint ? <dd className="mt-1 text-xs">{hint}</dd> : null}
    </div>
  );
}
