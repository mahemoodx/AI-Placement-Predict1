/** Placement probability gauge — pure SVG, theme-token colours only. */
export function Gauge({ value, label = "Placement probability", size = 180 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 70;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r; // half circle
  const dash = (v / 100) * circumference;
  // 85-100 green · 70-84 blue · 50-69 orange · below 50 red
  const tone = v >= 85 ? "var(--chart-2)" : v >= 70 ? "var(--chart-1)" : v >= 50 ? "var(--chart-4)" : "var(--destructive)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" width={size} height={size * 0.6} role="img" aria-label={`${label}: ${Math.round(v)}%`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={tone}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <text x={cx} y={cy - 12} textAnchor="middle" className="fill-foreground" fontSize="30" fontWeight="700">
          {Math.round(v)}%
        </text>
      </svg>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
