import { useState } from 'react';
import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';

type Tab = 'restaurant' | 'tech' | 'clinic' | 'beauty' | 'clothing' | 'gym' | 'pharmacy' | 'veterinary' | 'hotel' | 'bakery' | 'workshop' | 'other';
const TABS: Tab[] = ['restaurant', 'tech', 'clinic', 'beauty', 'clothing', 'gym', 'pharmacy', 'veterinary', 'hotel', 'bakery', 'workshop', 'other'];

export function Industries() {
  const { t } = useI18n();
  const [active, setActive] = useState<Tab>('restaurant');
  const ref = useIntersection();

  const content = t.industries[active];

  return (
    <section id="industries" className="py-24 bg-brand-light" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
            {t.industries.title}
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.industries.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 animate-on-scroll stagger-1">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                active === tab
                  ? 'bg-brand-dark text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{t.industries[tab].emoji}</span>
              <span>{t.industries.tabs[i]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-8 items-center animate-on-scroll stagger-2">
          <div>
            <h3 className="font-display font-bold text-2xl text-brand-dark mb-6">{content.title}</h3>
            <ul className="space-y-3 mb-8">
              {content.features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-slate-600">
                  <span className="w-5 h-5 bg-brand-green/15 text-brand-green rounded-full flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
            <blockquote className="bg-white border-l-4 border-brand-green rounded-r-xl p-5 shadow-sm">
              <p className="text-slate-700 italic mb-2">{content.quote}</p>
              <cite className="text-sm text-slate-500 not-italic font-medium">{content.author}</cite>
            </blockquote>
          </div>

          {/* Decorative side */}
          <div className="relative">
            <div className="bg-brand-dark rounded-2xl p-8 text-center shadow-xl">
              <div className="text-8xl mb-4">{t.industries[active].emoji}</div>
              <div className="text-white font-display font-bold text-xl mb-2">{content.title}</div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {content.features.slice(0, 3).map((feat) => (
                  <span key={feat} className="bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                    {feat.split(' ').slice(0, 4).join(' ')}...
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute -inset-3 bg-brand-green/10 rounded-3xl blur-xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
