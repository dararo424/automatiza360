import { useI18n } from '../hooks/useI18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-brand-dark border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="font-display font-bold text-xl text-white mb-3">
              Automatiza<span className="text-brand-green">360</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
            <div className="flex gap-3 mt-4">
              {['twitter', 'instagram', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors text-xs"
                  aria-label={social}
                >
                  {social === 'twitter' ? 'X' : social === 'instagram' ? 'IG' : 'in'}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <div className="space-y-2">
              {[t.footer.terms, t.footer.privacy, t.footer.contact].map((link) => (
                <a key={link} href="#" className="block text-slate-400 hover:text-white text-sm transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contacto</h4>
            <a
              href={`mailto:${t.footer.email}`}
              className="text-slate-400 hover:text-brand-green text-sm transition-colors"
            >
              {t.footer.email}
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-slate-500 text-sm">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
