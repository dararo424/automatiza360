import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetearContrasena } from '../../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exitoso, setExitoso] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await resetearContrasena(token, password);
      localStorage.removeItem('token'); // invalidar sesión activa
      setExitoso(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El enlace es inválido o ha expirado.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Enlace inválido</h2>
          <p className="text-slate-500 mb-6">
            El enlace de recuperación no es válido. Por favor solicita uno nuevo.
          </p>
          <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
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

          {exitoso ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Contraseña actualizada</h2>
              <p className="text-slate-500 mb-6">
                Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
              </p>
              <Link
                to="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Nueva contraseña</h2>
              <p className="text-slate-500 mb-8">
                Crea una nueva contraseña para tu cuenta. Debe tener al menos 6 caracteres.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                    Nueva contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirmar">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmar"
                    type="password"
                    required
                    minLength={6}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Repite la contraseña"
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
                      Guardando...
                    </>
                  ) : (
                    'Cambiar contraseña'
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
