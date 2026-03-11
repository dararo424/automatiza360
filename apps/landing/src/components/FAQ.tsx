import { useState } from 'react';
import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

export function FAQ() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const ref = useIntersection();

  return (
    <section id="contact" className="py-24 bg-brand-dark" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.faq.title}
          </h2>
          <p className="text-slate-400 text-lg">{t.faq.subtitle}</p>
        </div>

        <div className="space-y-3 animate-on-scroll stagger-1">
          {t.faq.items.map((item, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-white font-semibold hover:bg-white/5 transition-colors"
              >
                <span className="text-sm">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-brand-green transition-transform flex-shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
