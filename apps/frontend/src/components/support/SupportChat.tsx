import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { enviarMensajeSoporte, type MensajeSoporte } from '../../api/soporte';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de soporte de Automatiza360. ¿En qué te puedo ayudar?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  async function sendMessage() {
    const texto = input.trim();
    if (!texto || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: texto };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const historial: MensajeSoporte[] = updatedMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(0, -1) // exclude the message we just added (it's the current message)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const result = await enviarMensajeSoporte(texto, historial);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.respuesta },
      ]);

      if (!result.resolved) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: 'Un agente humano ha sido notificado y se pondrá en contacto contigo pronto.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg flex items-center justify-center transition-all duration-200"
        title="Soporte"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">
              A
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Soporte Automatiza360</p>
              <p className="text-xs text-indigo-200">Respuesta inmediata</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') {
                return (
                  <div key={idx} className="flex justify-center">
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-center">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-slate-200 bg-white shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              placeholder="Escribe tu pregunta..."
              className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 max-h-24"
              style={{ overflow: 'auto' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
