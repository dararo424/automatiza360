const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface CalendarioMesProps {
  year: number;
  month: number; // 1–12
  citasPorDia: Record<string, number>;
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CalendarioMes({
  year,
  month,
  citasPorDia,
  selectedDay,
  onSelectDay,
  onChangeMonth,
}: CalendarioMesProps) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday-based offset: Sun(0)→6, Mon(1)→0, Tue(2)→1, …
  const offset = (firstDay.getDay() + 6) % 7;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (month === 1) onChangeMonth(year - 1, 12);
    else onChangeMonth(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onChangeMonth(year + 1, 1);
    else onChangeMonth(year, month + 1);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-lg leading-none"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-slate-800">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-lg leading-none"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="aspect-square" />;

          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          const count = citasPorDia[dateStr] ?? 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                ${isSelected
                  ? 'bg-indigo-600 text-white'
                  : isToday
                    ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-300'
                    : 'text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              <span className="leading-none text-sm">{day}</span>
              {count > 0 && (
                <span
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-indigo-200' : 'bg-emerald-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        <span>Días con citas</span>
      </div>
    </div>
  );
}
