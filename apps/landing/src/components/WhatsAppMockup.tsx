import { useEffect, useState } from 'react';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
  delay: number;
}

const MESSAGES_ES: Message[] = [
  { id: 1, from: 'user', text: '¡Hola! ¿Tienen el menú del día?', delay: 0 },
  { id: 2, from: 'bot', text: '¡Hola! 😊 Claro, aquí está el menú de hoy:\n\n🥗 Ensalada César — $12.000\n🍝 Pasta Carbonara — $18.000\n🥩 Lomo al trapo — $25.000\n🍮 Postre del día — $6.000', delay: 1500 },
  { id: 3, from: 'user', text: 'Quiero 1 Pasta Carbonara y 1 Lomo al trapo, por favor', delay: 3500 },
  { id: 4, from: 'bot', text: '✅ Pedido registrado:\n• 1x Pasta Carbonara — $18.000\n• 1x Lomo al trapo — $25.000\n\nTotal: $43.000\n¿Confirmas el pedido?', delay: 5000 },
  { id: 5, from: 'user', text: 'Sí, confirmo', delay: 6500 },
  { id: 6, from: 'bot', text: '🎉 ¡Pedido confirmado! #P-042\nTe avisamos cuando esté listo. ¡Gracias!', delay: 7500 },
];

export function WhatsAppMockup() {
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    MESSAGES_ES.forEach((msg) => {
      if (msg.from === 'bot') {
        timers.push(setTimeout(() => setTyping(true), msg.delay - 800));
      }
      timers.push(
        setTimeout(() => {
          setTyping(false);
          setVisible((prev) => [...prev, msg.id]);
        }, msg.delay)
      );
    });

    // Restart animation
    const restartDelay = 10000;
    timers.push(
      setTimeout(() => {
        setVisible([]);
        setTyping(false);
        setCycle((c) => c + 1);
      }, restartDelay)
    );

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const shownMessages = MESSAGES_ES.filter((m) => visible.includes(m.id));

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Phone frame */}
      <div className="relative bg-[#111B21] rounded-3xl shadow-2xl overflow-hidden border border-white/10" style={{ aspectRatio: '9/16', maxHeight: '520px' }}>
        {/* Status bar */}
        <div className="bg-[#1F2C34] px-4 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-sm">🤖</div>
          <div>
            <p className="text-white text-xs font-semibold leading-none">Bot Automatiza360</p>
            <p className="text-green-400 text-xs mt-0.5">en línea</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="px-3 py-3 space-y-2 overflow-hidden h-full pb-16" style={{ background: '#0B141A' }}>
          {shownMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-[bubbleIn_0.3s_ease-out]`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  msg.from === 'user'
                    ? 'bg-[#005C4B] text-white rounded-tr-none'
                    : 'bg-[#1F2C34] text-slate-200 rounded-tl-none'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {msg.text}
                <span className="block text-right text-[10px] opacity-50 mt-1">
                  {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="bg-[#1F2C34] rounded-lg rounded-tl-none px-4 py-3 text-slate-400 text-xs">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
          <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5 text-xs text-slate-400">
            Escribe un mensaje...
          </div>
          <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-dark" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 bg-brand-green/20 rounded-3xl blur-2xl -z-10" />
    </div>
  );
}
