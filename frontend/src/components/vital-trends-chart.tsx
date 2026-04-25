type VitalTrendsChartProps = {
  values: number[];
  label?: string;
};

export function VitalTrendsChart({
  values,
  label = "Heart rate (bpm)",
}: VitalTrendsChartProps) {
  if (values.length === 0) {
    return (
      <div className="vital-trends-empty muted">No trend data available.</div>
    );
  }

  const w = 480;
  const h = 220;
  const padX = 36;
  const padY = 28;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const min = Math.min(...values) - 6;
  const max = Math.max(...values) + 6;
  const span = max - min || 1;

  const step = values.length > 1 ? innerW / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = padX + i * step;
    const y = padY + (1 - (v - min) / span) * innerH;
    return { x, y, v };
  });

  const lineD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD = `${lineD} L ${pts[pts.length - 1].x} ${padY + innerH} L ${pts[0].x} ${padY + innerH} Z`;

  return (
    <div className="vital-trends-chart">
      <div className="vital-trends-legend muted">{label}</div>
      <svg
        className="vital-trends-svg"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`${label} trend chart`}
      >
        <defs>
          <linearGradient id="vitalTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + t * innerH;
          return (
            <line
              key={t}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}
        <path d={areaD} fill="url(#vitalTrendFill)" />
        <path
          d={lineD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#fff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="vital-trends-axis muted">
        <span>{values.length} readings</span>
        <span>
          Low {Math.min(...values).toFixed(1)} — High {Math.max(...values).toFixed(1)}
        </span>
      </div>
    </div>
  );
}
