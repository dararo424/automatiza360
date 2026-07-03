import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';

/**
 * Demo pública del bot — conversación guiada (sin IA real, sin registro).
 * Simula "La Cocina de Marta", un restaurante ficticio, con los flujos
 * reales del producto: menú, pedido, puntos y horario.
 */

interface ChatMsg {
  from: 'bot' | 'user';
  text: string;
}

interface Node {
  bot: string[];
  options: { label: string; next: string }[];
}

const SCRIPT: Record<string, Node> = {
  start: {
    bot: [
      '¡Hola! 👋 Soy el asistente de *La Cocina de Marta*. Atiendo 24/7, incluso cuando Marta duerme 😴',
      '¿En qué te puedo ayudar hoy?',
    ],
    options: [
      { label: '🍽️ ¿Qué hay de menú hoy?', next: 'menu' },
      { label: '🕐 ¿A qué hora abren?', next: 'horario' },
      { label: '⭐ ¿Cuántos puntos tengo?', next: 'puntos' },
    ],
  },
  menu: {
    bot: [
      '¡Hoy tenemos delicias! 🤤\n\n• Bandeja paisa — $18.000\n• Sancocho de gallina — $15.000\n• Ajiaco santafereño — $16.000\n• Jugo natural — $5.000',
      '¿Te antojaste de algo?',
    ],
    options: [
      { label: 'Una bandeja paisa y un jugo 🙌', next: 'pedido' },
      { label: '¿El sancocho trae arroz?', next: 'pregunta' },
    ],
  },
  pregunta: {
    bot: [
      '¡Claro que sí! El sancocho de gallina viene con arroz, aguacate y arepa. Porción bien servida, como debe ser 😄',
    ],
    options: [
      { label: 'Entonces un sancocho por favor', next: 'pedido2' },
      { label: 'Mejor la bandeja paisa', next: 'pedido' },
    ],
  },
  pedido: {
    bot: [
      '¡Excelente elección! 📝 Tu pedido:\n\n• Bandeja paisa x1 — $18.000\n• Jugo natural x1 — $5.000\n\n*Total: $23.000*',
      '¿Cómo prefieres pagar? Efectivo, Nequi o tarjeta al recibir.',
    ],
    options: [
      { label: 'Nequi 📱', next: 'confirmar' },
      { label: 'Efectivo 💵', next: 'confirmar' },
    ],
  },
  pedido2: {
    bot: [
      '¡Perfecto! 📝 Tu pedido:\n\n• Sancocho de gallina x1 — $15.000\n\n*Total: $15.000*',
      '¿Cómo prefieres pagar? Efectivo, Nequi o tarjeta al recibir.',
    ],
    options: [
      { label: 'Nequi 📱', next: 'confirmar' },
      { label: 'Efectivo 💵', next: 'confirmar' },
    ],
  },
  confirmar: {
    bot: [
      '✅ ¡Pedido #48 confirmado! Estará listo en ~25 minutos.',
      'Además sumaste *2 puntos* de fidelidad 🎉 Ya llevas 14 — con 20 reclamas un jugo gratis.',
      'Marta acaba de recibir tu pedido en su panel y en su WhatsApp. Te avisamos cuando esté listo 🔔',
    ],
    options: [
      { label: '🤯 ¿Y Marta no tocó el teléfono?', next: 'final' },
    ],
  },
  horario: {
    bot: [
      'Abrimos de *lunes a sábado, 11:00 am a 9:00 pm*. Los domingos descansamos 😊',
      'Puedes pedir por aquí a cualquier hora y programamos tu pedido para cuando abramos.',
    ],
    options: [
      { label: 'Genial, muéstrame el menú', next: 'menu' },
    ],
  },
  puntos: {
    bot: [
      'Déjame revisar... 🔎',
      '¡Tienes *12 puntos* acumulados! ⭐ Con 20 puntos reclamas un jugo natural gratis. Cada $10.000 en compras suma 1 punto.',
    ],
    options: [
      { label: 'Pues pidamos algo 😄', next: 'menu' },
    ],
  },
  final: {
    bot: [
      'Exacto. *Cero intervención humana*: tomé el pedido, apliqué los puntos, registré la venta en el inventario y notifiqué a la dueña.',
      'Esto mismo puede hacer tu negocio: restaurante, clínica, taller, tienda, salón... El bot se adapta a tu industria.',
      '¿Creamos el tuyo? La prueba es gratis por 14 días, sin tarjeta 🚀',
    ],
    options: [],
  },
};

const TYPING_MS = 1100;

export function DemoBotPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [nodeKey, setNodeKey] = useState('start');
  const [typing, setTyping] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const node = SCRIPT[nodeKey];
  const done = nodeKey === 'final' && optionsVisible;

  // Reproduce los mensajes del nodo actual con "escribiendo..." entre cada uno
  useEffect(() => {
    if (!node) return;
    setOptionsVisible(false);
    let delay = 400;
    node.bot.forEach((text, i) => {
      timers.current.push(setTimeout(() => setTyping(true), delay));
      delay += TYPING_MS + Math.min(text.length * 8, 900);
      timers.current.push(
        setTimeout(() => {
          setTyping(false);
          setMessages((prev) => [...prev, { from: 'bot', text }]);
          if (i === node.bot.length - 1) setOptionsVisible(true);
        }, delay),
      );
      delay += 250;
    });
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, optionsVisible]);

  function choose(option: { label: string; next: string }) {
    setMessages((prev) => [...prev, { from: 'user', text: option.label }]);
    setNodeKey(option.next);
  }

  function restart() {
    timers.current.forEach(clearTimeout);
    setMessages([]);
    setTyping(false);
    setOptionsVisible(false);
    setNodeKey('start');
    // Fuerza re-ejecución si ya estamos en start
    if (nodeKey === 'start') {
      setNodeKey('__reset__');
      setTimeout(() => setNodeKey('start'), 0);
    }
  }

  // Nodo fantasma para reinicio
  if (!node) {
    return <div className="min-h-screen bg-ink" />;
  }

  function renderText(text: string) {
    // *negrita* estilo WhatsApp
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((p, i) =>
      p.startsWith('*') && p.endsWith('*') ? <strong key={i}>{p.slice(1, -1)}</strong> : <span key={i}>{p}</span>,
    );
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col relative overflow-hidden">
      {/* Retícula de marca */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#c9f24b 1px, transparent 1px), linear-gradient(90deg, #c9f24b 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-baseline gap-0.5 select-none">
          <span className="font-display text-xl font-bold tracking-tight text-bone">automatiza</span>
          <span className="font-display text-xl font-bold tracking-tight text-lima">360°</span>
        </Link>
        <a href="/onboarding" className="hidden sm:inline-flex btn-lima !py-2 !px-4 text-sm">
          Crear mi bot gratis
        </a>
      </header>

      <main className="relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-6 pb-10 max-w-5xl mx-auto w-full">
        {/* Copy lateral */}
        <div className="lg:flex-1 text-center lg:text-left max-w-md">
          <p className="label-mono !text-lima/60 mb-3">Demo interactiva · Sin registro</p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-bone leading-tight tracking-tight mb-4">
            Chatea con el bot de un negocio real*
          </h1>
          <p className="text-bone/60 text-sm mb-2">
            *Bueno, casi: "La Cocina de Marta" es ficticio, pero el bot hace exactamente esto en los
            negocios que ya usan Automatiza360 — tomar pedidos, sumar puntos y avisarle al dueño. Solo, 24/7.
          </p>
          <p className="text-bone/40 font-mono text-[11px] uppercase tracking-[0.14em] mt-6">
            Toca las respuestas para conversar →
          </p>
        </div>

        {/* Teléfono */}
        <div className="w-full max-w-sm">
          <div className="bg-bone rounded-[2rem] border-2 border-ink shadow-pop-lima overflow-hidden">
            {/* Chat header */}
            <div className="bg-selva-800 px-4 py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-lima flex items-center justify-center text-lg" aria-hidden>
                👩‍🍳
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-bone font-semibold text-sm leading-tight">La Cocina de Marta</p>
                <p className="text-lima font-mono text-[10px] uppercase tracking-wide">
                  {typing ? 'escribiendo…' : 'en línea · responde al instante'}
                </p>
              </div>
              <button
                onClick={restart}
                aria-label="Reiniciar demo"
                className="text-bone/60 hover:text-lima transition-colors p-1.5"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto px-3 py-4 space-y-2"
              style={{ background: '#efe9dc' }}
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 text-[13.5px] leading-snug whitespace-pre-line rounded-2xl ${
                      m.from === 'user'
                        ? 'bg-lima text-ink rounded-br-md'
                        : 'bg-white text-ink rounded-bl-md shadow-card'
                    }`}
                  >
                    {renderText(m.text)}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md shadow-card px-4 py-3 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Options / CTA */}
            <div className="bg-bone border-t border-bone-deep p-3 min-h-[76px]">
              {done ? (
                <a href="/onboarding" className="btn-lima w-full !py-3">
                  Crear mi bot gratis — 14 días
                  <ArrowRight size={17} strokeWidth={2.5} aria-hidden />
                </a>
              ) : optionsVisible ? (
                <div className="flex flex-wrap gap-2">
                  {node.options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => choose(opt)}
                      className="text-[13px] font-medium text-ink bg-white border border-ink/30 rounded-full px-3.5 py-2 hover:bg-lima hover:border-ink transition-colors text-left"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 font-mono text-[11px] pt-3">…</p>
              )}
            </div>
          </div>

          <p className="text-center text-bone/40 text-xs mt-4 sm:hidden">
            <a href="/onboarding" className="text-lima underline underline-offset-2 font-semibold">
              Crear mi bot gratis →
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
