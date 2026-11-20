import type { ProgressPoint } from '../types/care';

interface ProgressTrendChartProps {
  points: ProgressPoint[];
  height?: number;
}

export function ProgressTrendChart({
  points,
  height = 176,
}: ProgressTrendChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center border border-dashed border-[#E6E2DA] rounded-xl text-sm text-[#57534E]">
        No weekly submissions recorded yet.
      </div>
    );
  }

  const width = 560;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xFor = (i: number) => {
    if (points.length === 1) return padLeft + plotW / 2;
    return padLeft + (i / (points.length - 1)) * plotW;
  };

  const yCompletion = (pct: number) =>
    padTop + plotH - (Math.max(0, Math.min(100, pct)) / 100) * plotH;

  const yMood = (score: number) =>
    padTop + plotH - ((Math.max(1, Math.min(5, score)) - 1) / 4) * plotH;

  const completionPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yCompletion(p.completionRate).toFixed(1)}`)
    .join(' ');

  const moodPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yMood(p.moodScore).toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 text-xs text-[#57534E]">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#2045C8] inline-block" aria-hidden="true" />
            <span>Task completion (%)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#B83B67] inline-block" aria-hidden="true" />
            <span>Self-reported steadiness (1–5)</span>
          </span>
        </div>
        <span className="font-mono tabular-nums">
          {points.length} logged {points.length === 1 ? 'week' : 'weeks'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Weekly homework completion and mood steadiness chart"
      >
        {/* Horizontal reference lines */}
        {[0, 50, 100].map((val) => {
          const y = yCompletion(val);
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E6E2DA"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-[#78716C] text-[10px] font-mono"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Mood line */}
        {points.length > 1 && (
          <path
            d={moodPath}
            fill="none"
            stroke="#B83B67"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Completion line */}
        {points.length > 1 && (
          <path
            d={completionPath}
            fill="none"
            stroke="#2045C8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points and week labels */}
        {points.map((p, i) => {
          const cx = xFor(i);
          const cyComp = yCompletion(p.completionRate);
          const cyMood = yMood(p.moodScore);
          return (
            <g key={`${p.weekLabel}-${i}`}>
              <circle
                cx={cx}
                cy={cyComp}
                r="4"
                fill="#FFFFFF"
                stroke="#2045C8"
                strokeWidth="2.2"
              />
              <circle
                cx={cx}
                cy={cyMood}
                r="3.5"
                fill="#FFFFFF"
                stroke="#B83B67"
                strokeWidth="2"
              />
              <text
                x={cx}
                y={height - 14}
                textAnchor="middle"
                className="fill-[#151B2E] text-[11px] font-medium"
              >
                {p.weekLabel}
              </text>
              <text
                x={cx}
                y={height - 2}
                textAnchor="middle"
                className="fill-[#78716C] text-[9.5px] font-mono"
              >
                {p.submittedDate}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
