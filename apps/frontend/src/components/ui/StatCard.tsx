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
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {up ? '↑' : '↓'} {pct !== null ? `${pct}%` : (diff > 0 ? `+${diff}` : diff)}
      {label && <span className="font-normal opacity-75 ml-0.5">{label}</span>}
    </span>
  );
}

export function StatCard({ title, value, subtitle, colorClass, emoji = '📊', trend }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClass} p-6 flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {trend && <TrendBadge {...trend} />}
        </div>
      </div>
      <span className="text-4xl opacity-80">{emoji}</span>
    </div>
  );
}
