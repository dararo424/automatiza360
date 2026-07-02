import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const CAPACIDADES = ['pedidos', 'citas', 'inventario', 'campañas', 'reseñas', 'caja'];

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bone">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-bone">
      {/* Panel izquierdo: manifiesto de marca */}
      <div className="hidden md:flex md:w-[54%] bg-ink relative flex-col justify-between p-12 overflow-hidden">
        {/* Retícula decorativa */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#c9f24b 1px, transparent 1px), linear-gradient(90deg, #c9f24b 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        {/* Halo lima */}
        <div
          aria-hidden
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-lima/20 blur-[120px]"
        />

        <div className="relative flex items-baseline gap-0.5 select-none">
          <span className="font-display text-2xl font-bold tracking-tight text-bone">automatiza</span>
          <span className="font-display text-2xl font-bold tracking-tight text-lima">360°</span>
        </div>

        <div className="relative max-w-lg">
          <p className="label-mono !text-lima/60 mb-4">Plataforma de gestión por WhatsApp</p>
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-bone leading-[1.05] tracking-tight">
            Tu negocio,
            <br />
            atendido{' '}
            <span className="relative inline-block text-lima">
              24/7
              <svg
                aria-hidden
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path d="M2 9C60 3 140 3 198 8" stroke="#c9f24b" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            sin que muevas
            <br />
            un dedo.
          </h1>
          <div className="mt-8 flex flex-wrap gap-2">
            {CAPACIDADES.map((c) => (
              <span
                key={c}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/70 border border-bone/20 rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-[11px] uppercase tracking-[0.18em] text-bone/40">
          Hecho para negocios de Latinoamérica
        </p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-baseline gap-0.5 justify-center mb-10 select-none">
            <span className="font-display text-3xl font-bold tracking-tight text-ink">automatiza</span>
            <span className="font-display text-3xl font-bold tracking-tight text-selva-600">360°</span>
          </div>

          <div className="card-pop p-8">
            <p className="label-mono mb-2">Bienvenido de vuelta</p>
            <h2 className="font-display text-3xl font-bold text-ink mb-8">Iniciar sesión</h2>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-xl p-3 mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-brand"
                  placeholder="correo@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-brand"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-selva-600 font-medium hover:underline underline-offset-2"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <button type="submit" disabled={submitting} className="btn-lima w-full !py-3">
                {submitting ? 'Iniciando sesión…' : (
                  <>
                    Entrar al panel
                    <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes cuenta?{' '}
            <a href="/onboarding" className="text-selva-600 font-semibold hover:underline underline-offset-2">
              Regístrate gratis →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
