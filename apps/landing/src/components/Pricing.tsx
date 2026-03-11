import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

const APP_URL = (import.meta.env['VITE_APP_URL'] as string | undefined) ?? 'http://localhost:5173';
const POPULAR_INDEX = 1;

export function Pricing() {
  const { t } = useI18n();
  const ref = useIntersection();

  return (
    <section id="pricing" className="py-24 bg-brand-dark" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">{t.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {t.pricing.plans.map((plan, i) => {
            const isPopular = i === POPULAR_INDEX;
            return (
              <div
                key={plan.name}
                className={`animate-on-scroll stagger-${i + 1} relative rounded-2xl p-8 flex flex-col ${
                  isPopular
                    ? 'bg-brand-green text-brand-dark ring-2 ring-brand-green shadow-2xl shadow-green-500/30 scale-105'
                    : 'bg-white/5 border border-white/10 text-white'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-dark text-brand-green text-xs font-bold px-4 py-1.5 rounded-full border border-brand-green/30">
                    ⭐ {t.pricing.popular}
                  </span>
                )}

                <div className="mb-6">
                  <h3 className={`font-display font-bold text-xl mb-1 ${isPopular ? 'text-brand-dark' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${isPopular ? 'text-green-800' : 'text-slate-400'}`}>{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <span className={`text-4xl font-display font-bold ${isPopular ? 'text-brand-dark' : 'text-white'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${isPopular ? 'text-green-800' : 'text-slate-400'}`}>
                    {t.pricing.currency}{t.pricing.period}
                  </span>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className={`flex items-center gap-2.5 text-sm ${isPopular ? 'text-green-900' : 'text-slate-300'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isPopular ? 'bg-green-900/20' : 'bg-brand-green/20 text-brand-green'}`}>
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <a
                  href={`${APP_URL}/onboarding`}
                  className={`block text-center font-bold py-3 rounded-xl transition-all hover:scale-105 ${
                    isPopular
                      ? 'bg-brand-dark text-brand-green hover:bg-slate-900'
                      : 'bg-brand-green/10 border border-brand-green/30 text-brand-green hover:bg-brand-green/20'
                  }`}
                >
                  {t.pricing.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-400 text-sm animate-on-scroll">
          🎉 {t.pricing.note}
        </p>
      </div>
    </section>
  );
}
