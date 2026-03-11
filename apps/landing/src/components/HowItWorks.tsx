import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

export function HowItWorks() {
  const { t } = useI18n();
  const ref = useIntersection();

  const steps = [
    { emoji: '🚀', title: t.how.step1Title, desc: t.how.step1Desc, num: '01' },
    { emoji: '📋', title: t.how.step2Title, desc: t.how.step2Desc, num: '02' },
    { emoji: '💬', title: t.how.step3Title, desc: t.how.step3Desc, num: '03' },
  ];

  return (
    <section id="how" className="py-24 bg-brand-light" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
            {t.how.title}
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.how.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-brand-green/30" />

          {steps.map((step, i) => (
            <div key={step.num} className={`animate-on-scroll stagger-${i + 1} text-center`}>
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-brand-green/10 rounded-2xl rotate-6" />
                <div className="relative bg-white rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg text-4xl">
                  {step.emoji}
                </div>
                <span className="absolute -top-2 -right-2 bg-brand-green text-brand-dark text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
