import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

const COMPETITORS = [
  { name: 'WATI (India)',             price: 'USD $49–349',  ai: false, multi: false, es: false, highlight: false },
  { name: 'ManyChat (EEUU)',          price: 'USD $15–300',  ai: false, multi: false, es: false, highlight: false },
  { name: 'Respond.io (Global)',      price: 'USD $79–279',  ai: true,  multi: true,  es: false, highlight: false },
  { name: 'Landbot (España)',         price: 'USD $40–400',  ai: false, multi: false, es: true,  highlight: false },
  { name: 'Chatbot Colombia (Local)', price: 'Cotización',   ai: false, multi: false, es: true,  highlight: false },
  { name: '✦ Automatiza360',         price: 'USD $19–129',  ai: true,  multi: true,  es: true,  highlight: true  },
];

function Check({ yes, highlight }: { yes: boolean; highlight: boolean }) {
  if (yes) {
    return (
      <span className={`font-bold ${highlight ? 'text-brand-dark' : 'text-brand-green'}`}>✓</span>
    );
  }
  return <span className="text-slate-600">✗</span>;
}

export function Competitors() {
  const { t } = useI18n();
  const ref = useIntersection();

  return (
    <section className="py-24 bg-slate-950" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.competitors.title}
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{t.competitors.subtitle}</p>
        </div>

        <div className="animate-on-scroll overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {t.competitors.columns.map((col) => (
                  <th key={col} className="px-5 py-4 text-left text-slate-400 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((row) => (
                <tr
                  key={row.name}
                  className={`border-b border-white/5 last:border-0 transition-colors ${
                    row.highlight
                      ? 'bg-brand-green text-brand-dark font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="px-5 py-4">{row.price}</td>
                  <td className="px-5 py-4 text-center"><Check yes={row.ai} highlight={row.highlight} /></td>
                  <td className="px-5 py-4 text-center"><Check yes={row.multi} highlight={row.highlight} /></td>
                  <td className="px-5 py-4 text-center"><Check yes={row.es} highlight={row.highlight} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
