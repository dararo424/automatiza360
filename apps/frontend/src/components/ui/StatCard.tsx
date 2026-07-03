interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass: string;
  emoji?: string;
  trend?: { current: number; previous: number; label?: string };
}

function TrendBadge({ current, previous, label }: { current: number; previous: number; label?: string }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const pct = previous === 0 ? null : Math.round(Math.abs(diff / previous) * 100);
  const up = diff >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md ring-1 ring-inset ${
        up ? 'bg-lima-ghost text-selva-800 ring-selva-300' : 'bg-red-50 text-red-600 ring-red-200'
      }`}
    >
      {up ? '↑' : '↓'} {pct !== null ? `${pct}%` : (diff > 0 ? `+${diff}` : diff)}
      {label && <span className="font-normal opacity-75 ml-0.5">{label}</span>}
    </span>
  );
}

export function StatCard({ title, value, subtitle, colorClass, emoji = '📊', trend }: StatCardProps) {
  return (
    <div className={`card border-l-4 ${colorClass} p-5 flex items-center justify-between transition-shadow hover:shadow-pop-sm`}>
      <div className="min-w-0">
        <p className="label-mono">{title}</p>
        <p className="font-display text-3xl font-bold text-ink mt-1.5 tabular-nums">{value}</p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {trend && <TrendBadge {...trend} />}
        </div>
      </div>
      <span className="text-3xl opacity-70 flex-shrink-0 ml-3" aria-hidden>{emoji}</span>
    </div>
  );
}
