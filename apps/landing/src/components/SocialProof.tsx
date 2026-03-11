import { useI18n } from '../hooks/useI18n';

const LOGOS = [
  { name: 'Galettes & Co', emoji: '🥐', type: 'Restaurante' },
  { name: 'Tienda Gamer', emoji: '🎮', type: 'Tecnología' },
  { name: 'MediCare', emoji: '🏥', type: 'Clínica' },
  { name: 'PrintShop', emoji: '🖨️', type: 'Servicios' },
  { name: 'AutoPartes', emoji: '🔧', type: 'Automotriz' },
];

export function SocialProof() {
  const { t } = useI18n();

  return (
    <section className="bg-brand-dark border-t border-b border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-slate-400 text-sm uppercase tracking-widest mb-8">
          {t.social.title}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
          {LOGOS.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-2xl">{logo.emoji}</span>
              <div>
                <p className="text-white font-display font-semibold text-sm">{logo.name}</p>
                <p className="text-slate-500 text-xs">{logo.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
