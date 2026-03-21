import { useState, useRef, useEffect } from 'react';

const RESPONSES: Record<string, string> = {
  hola: '¡Hola! 👋 Bienvenido a nuestra tienda. ¿En qué te puedo ayudar?\n\n1️⃣ Ver menú/catálogo\n2️⃣ Hacer un pedido\n3️⃣ Ver horarios\n4️⃣ Hablar con un humano',
  '1': '📋 Aquí está nuestro menú de hoy:\n\n🍽️ Bandeja Paisa - $18.000\n🍗 Pollo a la plancha - $15.000\n🥗 Ensalada César - $12.000\n🍰 Postre del día - $6.000\n\n¿Deseas ordenar algo?',
  '2': '¡Perfecto! ¿Qué deseas pedir? Escríbeme el nombre del plato y la cantidad. Ej: "2 bandejas paisas"',
  bandeja: '✅ Anotado: 2 Bandejas Paisas - $36.000\n\n¿Es para llevar o domicilio?\n\n🏪 Para llevar\n🛵 Domicilio',
  domicilio: '📍 ¿Cuál es tu dirección de entrega?',
  calle: '✅ ¡Pedido confirmado!\n\n📋 Resumen:\n• 2 Bandejas Paisas - $36.000\n• Domicilio a tu dirección\n• Tiempo estimado: 35-45 min\n\n¡Gracias por tu pedido! 🙌',
  '3': '🕐 Nuestros horarios:\n\nLunes a Viernes: 7am - 8pm\nSábados: 8am - 6pm\nDomingos: 10am - 4pm\n\n¿Necesitas algo más?',
  '4': 'Entendido, te conecto con nuestro equipo. Un momento por favor... 🔄\n\n📞 También puedes llamarnos al 300 123 4567',
  precio: '💰 Nuestros precios van desde $6.000 hasta $25.000. ¿Te gustaría ver el menú completo?',
  horario: '🕐 Atendemos Lunes a Viernes 7am-8pm, Sábados 8am-6pm, Domingos 10am-4pm',
  cita: '📅 ¡Claro! ¿Para qué fecha y hora deseas tu cita?\n\nDisponibilidad esta semana:\n• Martes 25 - 10am, 2pm, 4pm\n• Miércoles 26 - 9am, 11am, 3pm\n• Jueves 27 - 10am, 1pm, 5pm',
  default: '¡Entendido! 😊 Déjame ayudarte. ¿Quieres ver nuestro menú, hacer un pedido, o prefieres hablar con alguien de nuestro equipo?',
};

interface Message {
  id: number;
  text: string;
  fromUser: boolean;
  timestamp: string;
}

function getTimestamp() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function getResponse(input: string): string {
  const normalized = input.toLowerCase().trim();
  for (const key of Object.keys(RESPONSES)) {
    if (key !== 'default' && normalized.includes(key)) {
      return RESPONSES[key];
    }
  }
  return RESPONSES.default;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 0, text: '¡Hola! 👋 Soy el bot de demostración de Automatiza360. Escribe "hola" para empezar.', fromUser: false, timestamp: getTimestamp() },
];

export function DemoChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appUrl = (import.meta as any).env?.VITE_APP_URL ?? 'https://app.automatiza360.com';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(text?: string) {
    const messageText = text ?? input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      fromUser: true,
      timestamp: getTimestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    setTimeout(() => {
      const botResponse = getResponse(messageText);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        fromUser: false,
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      if (newCount >= 5) {
        setShowCta(true);
      }
    }, 1000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickReplies = ['hola', 'ver menú', 'horarios', 'hacer pedido'];

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200" style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: '#25D366' }}>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Bot Demo - Automatiza360</p>
          <p className="text-green-100 text-xs">En línea</p>
        </div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: '#ECE5DD' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                msg.fromUser
                  ? 'rounded-tr-sm text-slate-800'
                  : 'rounded-tl-sm text-slate-800'
              }`}
              style={{ backgroundColor: msg.fromUser ? '#DCF8C6' : '#FFFFFF' }}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              <p className="text-xs text-slate-400 text-right mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {showCta && (
          <div className="bg-indigo-600 rounded-xl p-3 text-center">
            <p className="text-white text-sm font-semibold mb-2">¿Quieres este bot para tu negocio?</p>
            <a
              href={`${appUrl}/onboarding`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-indigo-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Regístrate gratis →
            </a>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="bg-white px-3 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => sendMessage(reply)}
            className="flex-shrink-0 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white px-3 py-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 text-sm border border-slate-200 rounded-full px-4 py-2 outline-none focus:border-green-400 text-slate-700"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
