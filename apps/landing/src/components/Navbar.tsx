import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import type { Lang } from '../i18n/translations';

const APP_URL = (import.meta.env['VITE_APP_URL'] as string | undefined) ?? 'http://localhost:5173';

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  const links = [
    { label: t.nav.features, id: 'features' },
    { label: t.nav.industries, id: 'industries' },
    { label: t.nav.pricing, id: 'pricing' },
    { label: t.nav.contact, id: 'contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="font-display font-bold text-xl text-white flex items-center gap-0.5">
            Automatiza<span className="text-brand-green">360</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm text-slate-300 hover:text-white transition-colors font-body"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 text-xs font-semibold">
              {(['es', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    lang === l ? 'bg-brand-green text-brand-dark' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href={`${APP_URL}/login`}
              className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              {t.nav.login}
            </a>
            <a
              href={`${APP_URL}/onboarding`}
              className="text-sm bg-brand-green hover:bg-green-400 text-brand-dark font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {t.nav.start}
            </a>
          </div>

          {/* Mobile: lang + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex items-center bg-white/10 rounded-full p-0.5 text-xs font-semibold">
              {(['es', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    lang === l ? 'bg-brand-green text-brand-dark' : 'text-slate-300'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-dark border-t border-white/10 px-4 pb-4 pt-2">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="block w-full text-left py-3 text-slate-300 hover:text-white text-sm border-b border-white/5"
            >
              {l.label}
            </button>
          ))}
          <div className="flex gap-2 mt-4">
            <a
              href={`${APP_URL}/login`}
              className="flex-1 text-center text-sm text-slate-300 border border-white/20 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {t.nav.login}
            </a>
            <a
              href={`${APP_URL}/onboarding`}
              className="flex-1 text-center text-sm bg-brand-green text-brand-dark font-semibold py-2.5 rounded-lg"
            >
              {t.nav.start}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
