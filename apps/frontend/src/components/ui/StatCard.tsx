interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass: string;
  emoji?: string;
}

export function StatCard({ title, value, subtitle, colorClass, emoji = '📊' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${colorClass} p-6 flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <span className="text-4xl opacity-80">{emoji}</span>
    </div>
  );
}
