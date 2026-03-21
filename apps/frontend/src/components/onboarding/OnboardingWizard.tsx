import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { updateOnboardingStep } from '../../api/onboarding';
import api from '../../api/axios';

interface OnboardingWizardProps {
  initialStep: number;
  onComplete: () => void;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Paso {current} de {total}</span>
        <span className="text-xs text-slate-400">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <div className="flex gap-1.5 mt-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${i < current ? 'bg-green-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
}

function Step1Welcome({ onNext, businessName, industry }: { onNext: () => void; businessName: string; industry: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Bienvenido a Automatiza360!</h2>
      <p className="text-slate-500 mb-4">
        Vamos a configurar tu negocio en 5 pasos. Solo toma 3 minutos.
      </p>
      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm text-slate-500 mb-1">Tu negocio</p>
        <p className="font-semibold text-slate-800">{businessName}</p>
        <p className="text-xs text-slate-400 mt-0.5">{industry}</p>
      </div>
      <button
        onClick={onNext}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Empezar →
      </button>
    </div>
  );
}

function Step2Perfil({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [descripcion, setDescripcion] = useState('');
  const [horario, setHorario] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/perfil', { descripcion, horario, ciudad });
      onNext();
    } catch {
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Tu página pública</h2>
      <p className="text-slate-500 text-sm mb-5">Esta información será visible para tus clientes</p>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describe tu negocio..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Horario de atención</label>
          <input
            type="text"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="Ej: Lun-Vie 8am-6pm"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej: Bogotá"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar y continuar →'}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          Omitir
        </button>
      </div>
    </div>
  );
}

function Step3Product({ onNext, onSkip, industry }: { onNext: () => void; onSkip: () => void; industry: string }) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [saving, setSaving] = useState(false);

  const isClinicBeauty = ['CLINIC', 'BEAUTY', 'GYM', 'VETERINARY', 'HOTEL'].includes(industry);
  const isRestaurant = ['RESTAURANT', 'BAKERY'].includes(industry);

  const getTitle = () => {
    if (isRestaurant) return 'Agrega el primer plato de tu menú';
    if (isClinicBeauty) return 'Agrega tu primer servicio';
    return 'Agrega tu primer producto';
  };

  const handleSave = async () => {
    if (!nombre || !precio) return;
    setSaving(true);
    try {
      // For any industry, create a product — services have same underlying data
      await api.post('/productos', {
        name: nombre,
        price: parseFloat(precio),
        stock: parseInt(stock) || 0,
      });
      onNext();
    } catch {
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Agrega tu primer producto</h2>
      <p className="text-slate-500 text-sm mb-5">{getTitle()}</p>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={isRestaurant ? 'Ej: Bandeja Paisa' : isClinicBeauty ? 'Ej: Consulta general' : 'Ej: iPhone 15'}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        {isClinicBeauty && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
            <input
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="30"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        )}
        {!isClinicBeauty && !isRestaurant && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock inicial</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !nombre || !precio}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Agregando...' : 'Agregar y continuar →'}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          Omitir
        </button>
      </div>
    </div>
  );
}

function Step4WhatsApp({
  onNext,
  twilioNumber,
  ownerPhone: initialOwnerPhone,
}: {
  onNext: () => void;
  twilioNumber?: string | null;
  ownerPhone?: string | null;
}) {
  const [ownerPhone, setOwnerPhone] = useState(initialOwnerPhone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (ownerPhone) {
        await api.patch('/perfil', { ownerPhone });
      }
      onNext();
    } catch {
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">Tu número de WhatsApp</h2>
      <p className="text-slate-500 text-sm mb-5">Tu bot responderá automáticamente a tus clientes</p>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-medium text-green-800 mb-1">Número del bot configurado</p>
        {twilioNumber ? (
          <p className="text-green-700 font-mono font-semibold">{twilioNumber}</p>
        ) : (
          <p className="text-slate-500 text-sm">Tu número se configura al activar el plan</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Tu teléfono (para recibir alertas)</label>
        <input
          type="tel"
          value={ownerPhone}
          onChange={(e) => setOwnerPhone(e.target.value)}
          placeholder="+57 300 000 0000"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Guardando...' : 'Continuar →'}
      </button>
    </div>
  );
}

function Step5Done({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Tu negocio está configurado!</h2>
      <p className="text-slate-500 mb-6">Estás listo para automatizar tu negocio con WhatsApp</p>
      <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
        {[
          'Perfil público configurado',
          'Primer producto / servicio agregado',
          'WhatsApp bot configurado',
          'Dashboard listo para usar',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="text-green-500 font-bold">✓</span>
            {item}
          </div>
        ))}
      </div>
      <button
        onClick={onFinish}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Ir al dashboard →
      </button>
    </div>
  );
}

export function OnboardingWizard({ initialStep, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(Math.max(1, initialStep || 1));

  const stepMutation = useMutation({
    mutationFn: (s: number) => updateOnboardingStep(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });

  const goToStep = (s: number) => {
    setStep(s);
    stepMutation.mutate(s);
  };

  const handleComplete = () => {
    stepMutation.mutate(5);
    onComplete();
  };

  const industry = user?.tenant?.industry ?? 'OTHER';
  const tenantName = user?.tenant?.name ?? '';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] p-8">
        {step > 1 && step < 5 && (
          <StepIndicator current={step} total={5} />
        )}

        {step === 1 && (
          <Step1Welcome
            onNext={() => goToStep(2)}
            businessName={tenantName}
            industry={industry}
          />
        )}
        {step === 2 && (
          <Step2Perfil
            onNext={() => goToStep(3)}
            onSkip={() => goToStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Product
            onNext={() => goToStep(4)}
            onSkip={() => goToStep(4)}
            industry={industry}
          />
        )}
        {step === 4 && (
          <Step4WhatsApp
            onNext={() => goToStep(5)}
            twilioNumber={null}
            ownerPhone={null}
          />
        )}
        {step === 5 && (
          <Step5Done onFinish={handleComplete} />
        )}
      </div>
    </div>
  );
}
