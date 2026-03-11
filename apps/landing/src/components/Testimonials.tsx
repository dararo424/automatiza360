import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

export function Testimonials() {
  const { t } = useI18n();
  const ref = useIntersection();

  return (
    <section className="py-24 bg-brand-light" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
            {t.testimonials.title}
          </h2>
          <p className="text-slate-500 text-lg">{t.testimonials.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {t.testimonials.items.map((item, i) => (
            <div
              key={i}
              className={`animate-on-scroll stagger-${i + 1} bg-white rounded-2xl p-7 shadow-sm border border-slate-100 flex flex-col`}
            >
              <div className="flex gap-1 mb-4">
                {Array(5).fill(0).map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-brand-green fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-6 italic">"{item.text}"</p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.author[0]}
                </div>
                <div>
                  <p className="font-semibold text-brand-dark text-sm">{item.author}</p>
                  <p className="text-xs text-slate-500">{item.company} · {item.industry}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
