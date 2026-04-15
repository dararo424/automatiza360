import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacion } from '../../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await solicitarRecuperacion(email);
      setEnviado(true);
    } catch {
      setError('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="text-6xl font-black mb-4">A360</div>
          <h1 className="text-3xl font-bold mb-4">Automatiza360</h1>
          <p className="text-indigo-200 text-lg">
            La plataforma todo-en-uno para gestionar tu negocio.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <span className="text-4xl font-black text-indigo-700">A360</span>
          </div>

          {enviado ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Revisa tu correo</h2>
              <p className="text-slate-500 mb-6">
                Si el correo existe, recibirás un enlace en breve para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="text-indigo-600 hover:underline font-medium text-sm"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Recuperar contraseña</h2>
              <p className="text-slate-500 mb-8">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="correo@empresa.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
