import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang, type Translations } from '../i18n/translations';

interface I18nContext {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const I18nCtx = createContext<I18nContext | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'en' ? 'en' : 'es') as Lang;
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('lang', l);
  }

  return (
    <I18nCtx.Provider value={{ lang, t: translations[lang] as Translations, setLang }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
