import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { registro, type RegistroResponse } from '../../api/auth';
import type { Industry } from '../../types';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  industry: Industry | '';
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

const INDUSTRY_OPTIONS: { value: Industry; label: string; emoji: string; desc: string }[] = [
  { value: 'RESTAURANT', label: 'Restaurante', emoji: '🍽️', desc: 'Gestión de órdenes, menú y delivery' },
  { value: 'TECH_STORE', label: 'Tienda de Tecnología', emoji: '💻', desc: 'Reparaciones, cotizaciones e inventario' },
  { value: 'CLINIC', label: 'Clínica / Consultorio', emoji: '🏥', desc: 'Citas, pacientes y expedientes' },
  { value: 'BEAUTY', label: 'Salón de Belleza / Spa', emoji: '💅', desc: 'Reservas, servicios y estilistas' },
  { value: 'CLOTHING_STORE', label: 'Tienda de Ropa', emoji: '👗', desc: 'Catálogo, tallas y pedidos' },
  { value: 'GYM', label: 'Gimnasio / Fitness', emoji: '🏋️', desc: 'Membresías, clases y horarios' },
  { value: 'PHARMACY', label: 'Farmacia / Droguería', emoji: '💊', desc: 'Inventario, precios y pedidos' },
  { value: 'VETERINARY', label: 'Veterinaria', emoji: '🐾', desc: 'Citas, historial de mascotas' },
  { value: 'HOTEL', label: 'Hotel / Hostal', emoji: '🏨', desc: 'Reservas de habitaciones' },
  { value: 'BAKERY', label: 'Panadería / Pastelería', emoji: '🍞', desc: 'Órdenes, menú y pedidos del día' },
  { value: 'WORKSHOP', label: 'Taller / Mecánica', emoji: '🔧', desc: 'Tickets de reparación e inventario' },
  { value: 'JEWELRY', label: 'Relojería / Joyería', emoji: '⌚', desc: 'Catálogo, reparaciones y garantías' },
  { value: 'OTHER', label: 'Otro tipo de negocio', emoji: '🏪', desc: 'Solución adaptable a tu industria' },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              s < current
                ? 'bg-indigo-600 text-white'
                : s === current
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            {s < current ? '✓' : s}
          </div>
          {s < 4 && (
            <div className={`w-12 h-0.5 ${s < current ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegistroResponse | null>(null);

  const [form, setForm] = useState<FormData>({
    businessName: '',
    ownerName: '',
    ownerPhone: '',
    industry: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function validateStep1() {
    if (!form.businessName.trim() || form.businessName.length < 2) {
      setError('El nombre del negocio debe tener al menos 2 caracteres');
      return false;
    }
    if (!form.ownerName.trim() || form.ownerName.length < 2) {
      setError('Tu nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (!/^\+?[1-9]\d{6,14}$/.test(form.ownerPhone)) {
      setError('Ingresa un número de WhatsApp válido (ej: +573001234567)');
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (!form.industry) {
      setError('Selecciona el tipo de negocio');
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!form.terms) {
      setError('Debes aceptar los términos y condiciones');
      return false;
    }
    return true;
  }

  function nextStep() {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s + 1) as Step);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    setError('');
    try {
      const response = await registro({
        businessName: form.businessName,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        industry: form.industry as Industry,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', response.token);
      setResult(response);
      setStep(4);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : (message ?? 'Error al crear la cuenta'));
    } finally {
      setLoading(false);
    }
  }

  function goToDashboard() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-2/5 bg-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="text-6xl font-black mb-4">A360</div>
          <h1 className="text-3xl font-bold mb-4">Automatiza360</h1>
          <p className="text-indigo-200 text-lg mb-8">
            La plataforma todo-en-uno para gestionar tu negocio con WhatsApp, IA y más.
          </p>
          <div className="space-y-3 text-left">
            {['14 días gratis, sin tarjeta', 'Bot de WhatsApp incluido', 'Dashboard en tiempo real', 'Soporte en español'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-indigo-100">
                <span className="text-green-400 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="md:hidden text-center mb-6">
            <span className="text-4xl font-black text-indigo-700">A360</span>
          </div>

          <StepIndicator current={step} />

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Cuéntanos sobre tu negocio</h2>
              <p className="text-slate-500 mb-6">Empieza con la información básica</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del negocio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => set('businessName', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Restaurante La Esquina"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu nombre (dueño) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => set('ownerName', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Juan García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu número de WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => set('ownerPhone', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+573001234567"
                  />
                  <p className="text-xs text-slate-400 mt-1">Incluye el código de país (ej: +57 para Colombia)</p>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">¿Qué tipo de negocio tienes?</h2>
              <p className="text-slate-500 mb-6">Personalizaremos la plataforma para ti</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {INDUSTRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('industry', opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.industry === opt.value
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="font-semibold text-slate-800 text-sm">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-300 text-slate-600 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Crea tu cuenta</h2>
              <p className="text-slate-500 mb-6">Solo falta tu acceso al dashboard</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Repite tu contraseña"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(e) => set('terms', e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-600">
                    Acepto los{' '}
                    <span className="text-indigo-600 underline cursor-pointer">términos y condiciones</span>{' '}
                    y la{' '}
                    <span className="text-indigo-600 underline cursor-pointer">política de privacidad</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-slate-300 text-slate-600 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear cuenta gratis'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4 */}
          {step === 4 && result && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Cuenta creada con éxito!</h2>
              <p className="text-slate-500 mb-6">
                Tienes <span className="font-bold text-indigo-600">14 días gratis</span> para explorar Automatiza360.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6 text-left">
                <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <span>💬</span> Configura tu bot de WhatsApp
                </h3>
                {result.sandboxMode ? (
                  <div>
                    <p className="text-sm text-indigo-800 mb-3">{result.setupInstructions}</p>
                    <div className="bg-white border border-indigo-300 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Envía este mensaje al número de WhatsApp:</p>
                      <p className="font-mono font-bold text-slate-800">
                        join {result.sandboxWord}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        al número:{' '}
                        <span className="font-mono font-semibold">+14155238886</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-indigo-800 mb-2">Tu número de WhatsApp empresarial:</p>
                    <p className="font-mono font-bold text-xl text-indigo-700">{result.twilioNumber}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Los clientes pueden escribirte a este número y el bot responderá automáticamente.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-800">
                <strong>Negocio:</strong> {result.tenant.name}
                <br />
                <strong>Trial hasta:</strong>{' '}
                {new Date(result.trialEndsAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <button
                onClick={goToDashboard}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Ir al dashboard →
              </button>
            </div>
          )}

          {step < 4 && (
            <p className="text-center text-sm text-slate-400 mt-6">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-indigo-600 hover:underline font-medium">
                Inicia sesión
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
