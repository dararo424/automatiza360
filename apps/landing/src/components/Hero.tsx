import { useI18n } from '../hooks/useI18n';
import { WhatsAppMockup } from './WhatsAppMockup';

const APP_URL = (import.meta.env['VITE_APP_URL'] as string | undefined) ?? 'http://localhost:5173';

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="min-h-screen bg-brand-dark flex items-center pt-16 overflow-hidden relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-green-950/30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="animate-on-scroll is-visible">
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
              {t.hero.eyebrow}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t.hero.title}
              <br />
              <span className="text-brand-green">{t.hero.titleAccent}</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <a
                href={`${APP_URL}/onboarding`}
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-green-400 text-brand-dark font-bold px-6 py-3.5 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-green-500/25"
              >
                {t.hero.cta}
              </a>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.hero.demo}
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {[t.hero.badge1, t.hero.badge2, t.hero.badge3].map((badge) => (
                <span key={badge} className="text-sm text-slate-400">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right: WhatsApp mockup */}
          <div className="flex justify-center lg:justify-end animate-on-scroll is-visible stagger-2">
            <WhatsAppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
