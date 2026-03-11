import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

export function Features() {
  const { t } = useI18n();
  const ref = useIntersection();

  const features = [
    { emoji: '🤖', title: t.features.f1Title, desc: t.features.f1Desc },
    { emoji: '📦', title: t.features.f2Title, desc: t.features.f2Desc },
    { emoji: '🎫', title: t.features.f3Title, desc: t.features.f3Desc },
    { emoji: '💰', title: t.features.f4Title, desc: t.features.f4Desc },
    { emoji: '📊', title: t.features.f5Title, desc: t.features.f5Desc },
    { emoji: '🔔', title: t.features.f6Title, desc: t.features.f6Desc },
  ];

  return (
    <section id="features" className="py-24 bg-brand-dark" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.features.title}
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">{t.features.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`animate-on-scroll stagger-${Math.min(i + 1, 6)} bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-brand-green/30 transition-all group`}
            >
              <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-brand-green/20 transition-colors">
                {f.emoji}
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
