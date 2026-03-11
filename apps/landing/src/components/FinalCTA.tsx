import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

const APP_URL = (import.meta.env['VITE_APP_URL'] as string | undefined) ?? 'http://localhost:5173';

export function FinalCTA() {
  const { t } = useI18n();
  const ref = useIntersection();

  return (
    <section className="py-24 bg-brand-light" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-on-scroll relative bg-brand-dark rounded-3xl p-12 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.finalCta.title}
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              {t.finalCta.subtitle}
            </p>
            <a
              href={`${APP_URL}/onboarding`}
              className="inline-block bg-brand-green hover:bg-green-400 text-brand-dark font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30 mb-4"
            >
              {t.finalCta.cta}
            </a>
            <p className="text-slate-500 text-sm">{t.finalCta.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
