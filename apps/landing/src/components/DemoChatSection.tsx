import type { RefObject } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useIntersection } from '../hooks/useIntersection';
import { DemoChat } from './DemoChat';

export function DemoChatSection() {
  const { t } = useI18n();
  const ref = useIntersection();

  return (
    <section id="demo" className="py-24 bg-white" ref={ref as RefObject<HTMLElement>}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-on-scroll">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            {t.demo.sectionLabel}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
            {t.demo.title}
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.demo.subtitle}</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 animate-on-scroll stagger-1">
          {/* Chat demo */}
          <div className="w-full lg:w-auto flex justify-center">
            <DemoChat />
          </div>

          {/* Features list */}
          <div className="flex-1 max-w-lg">
            <div className="space-y-5">
              {[
                { emoji: '🤖', title: 'IA de Google Gemini', desc: 'El bot entiende lenguaje natural y responde con contexto, como un empleado real.' },
                { emoji: '⚡', title: 'Respuestas instantáneas', desc: 'Tu bot responde en segundos, las 24 horas del día, los 7 días de la semana.' },
                { emoji: '📱', title: 'WhatsApp nativo', desc: 'Funciona directamente en WhatsApp. Tus clientes no necesitan descargar nada.' },
                { emoji: '🛒', title: 'Toma pedidos y citas', desc: 'Gestiona órdenes, reservas y consultas sin que tú tengas que intervenir.' },
                { emoji: '📊', title: 'Dashboard en tiempo real', desc: 'Supervisa todas las conversaciones y pedidos desde tu panel de control.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
