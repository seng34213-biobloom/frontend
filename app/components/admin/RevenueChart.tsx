/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- the scrollable chart region must be keyboard-focusable (axe scrollable-region-focusable). */
'use client';

import { useId, useState } from 'react';
import { Table, TableBody, TableHead, Td, Th } from '@biobloom/ui';
import { fmtMoney, shortDay } from '../../lib/admin/format';

export interface RevenuePoint {
  date: string;
  total: string;
}

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 44, left: 72 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Rounds the axis maximum up to a readable step (1, 2, 5 x 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * exp;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

/**
 * 30-day revenue trend (SDS §6.5). Single series, so no legend: the title
 * names it. The SVG is exposed as one image with a text summary, both axes
 * are titled, each day has a hover target with a tooltip, and the full
 * series is available as a data table for screen-reader and keyboard users.
 */
export function RevenueChart({ data, days }: { data: RevenuePoint[]; days: number }) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-forest-500 text-sm">No revenue recorded in the last {days} days.</p>;
  }

  const values = data.map((p) => Number(p.total));
  const total = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(...values);
  const peakDay = data[values.indexOf(peak)].date;
  const yMax = niceMax(peak);
  const stepX = data.length > 1 ? PLOT_W / (data.length - 1) : 0;
  const x = (i: number) => PAD.left + (data.length > 1 ? i * stepX : PLOT_W / 2);
  const y = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const yTicks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax];
  const xTickIdx = Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]));

  const summary = `Daily paid revenue from ${shortDay(data[0].date)} to ${shortDay(
    data[data.length - 1].date,
  )}. Total ${fmtMoney(total)}. Highest day ${shortDay(peakDay)} at ${fmtMoney(peak)}.`;

  const hovered = hover === null ? null : data[hover];

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label="Revenue chart, scrollable"
        tabIndex={0}
        className="relative overflow-x-auto"
      >
        <div className="relative min-w-[560px]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-labelledby={`${uid}-title ${uid}-desc`}
          >
            <title id={`${uid}-title`}>{`Revenue, last ${days} days`}</title>
            <desc id={`${uid}-desc`}>{summary}</desc>

            {yTicks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="#e8e0cf"
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill="#4c473c">
                  {compact(t)}
                </text>
              </g>
            ))}
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(0)}
              y2={y(0)}
              stroke="#8c8473"
              strokeWidth={1}
            />
            {xTickIdx.map((i) => (
              <text
                key={data[i].date}
                x={x(i)}
                y={H - PAD.bottom + 18}
                textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                fontSize={12}
                fill="#4c473c"
              >
                {shortDay(data[i].date)}
              </text>
            ))}
            <text
              x={PAD.left + PLOT_W / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={12}
              fill="#4c473c"
            >
              Date
            </text>
            <text
              transform={`translate(16 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={12}
              fill="#4c473c"
            >
              Revenue (LKR)
            </text>

            <polyline
              points={points}
              fill="none"
              stroke="#3f632e"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {hover !== null ? (
              <>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  stroke="#8c8473"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(hover)}
                  cy={y(values[hover])}
                  r={5}
                  fill="#3f632e"
                  stroke="#faf7f0"
                  strokeWidth={2}
                />
              </>
            ) : null}
            {data.map((p, i) => (
              <rect
                key={p.date}
                x={x(i) - Math.max(stepX, 8) / 2}
                y={PAD.top}
                width={Math.max(stepX, 8)}
                height={PLOT_H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </svg>
          {hovered && hover !== null ? (
            <div
              aria-hidden="true"
              className="border-cream-300 pointer-events-none absolute top-2 rounded-lg border bg-white px-3 py-2 text-xs shadow-md"
              style={{
                left: `${(x(hover) / W) * 100}%`,
                transform: hover > data.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
              }}
            >
              <p className="text-forest-700 font-semibold">{shortDay(hovered.date)}</p>
              <p className="text-forest-600">{fmtMoney(hovered.total)}</p>
            </div>
          ) : null}
        </div>
      </div>

      <details className="text-sm">
        <summary className="text-brand-700 cursor-pointer font-medium">
          Show revenue as a table
        </summary>
        <div className="mt-3">
          <Table caption={`Revenue per day, last ${days} days`}>
            <TableHead>
              <tr>
                <Th>Date</Th>
                <Th align="right">Revenue</Th>
              </tr>
            </TableHead>
            <TableBody>
              {data.map((p) => (
                <tr key={p.date}>
                  <Td>{shortDay(p.date)}</Td>
                  <Td align="right">{fmtMoney(p.total)}</Td>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}
