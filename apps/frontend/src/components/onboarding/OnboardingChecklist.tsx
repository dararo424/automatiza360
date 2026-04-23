import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DISMISSED_KEY = 'onboarding_checklist_dismissed';
const STEP_KEY = (n: number) => `onboarding_step_${n}`;

interface Step {
  id: number;
  label: string;
  description: string;
  link?: string;
  linkLabel?: string;
  auto?: boolean;
  isShareStep?: boolean;
}

function buildSteps(industry?: string): Step[] {
  const productStep: Step = { id: 1, label: 'Agrega tus productos', description: 'Crea al menos un producto para que el bot pueda tomar pedidos', link: '/productos', linkLabel: 'Ir a Productos' };
  const serviceStep: Step = { id: 1, label: 'Configura tus servicios', description: 'Agrega los servicios que ofreces con precios y duración', link: '/agenda', linkLabel: 'Ir a Agenda' };
  const connectStep: Step = { id: 2, label: 'Conecta tu WhatsApp', description: 'Activa el número de WhatsApp Business para recibir mensajes', link: '/mi-plan', linkLabel: 'Ver instrucciones' };
  const shareStep: Step = { id: 3, label: 'Comparte tu enlace', description: 'Copia tu enlace público y ponlo en tu bio de Instagram o WhatsApp', isShareStep: true };
  const teamStep: Step = { id: 4, label: 'Invita a tu equipo', description: 'Agrega a tu personal para que gestionen pedidos y citas', link: '/equipo', linkLabel: 'Ir a Equipo' };

  const firstStep: Step = { id: 0, label: 'Creaste tu cuenta', description: '¡Bienvenido a Automatiza360!', auto: true };

  const withServices = ['CLINIC', 'BEAUTY', 'GYM', 'HOTEL', 'VETERINARY'];
  const step1 = withServices.includes(industry ?? '') ? serviceStep : productStep;

  return [firstStep, step1, connectStep, shareStep, teamStep];
}

function isStepDone(step: Step): boolean {
  if (step.auto) return true;
  return localStorage.getItem(STEP_KEY(step.id)) === 'true';
}

function ShareStepContent({ slug }: { slug?: string }) {
  const [copied, setCopied] = useState(false);
  const url = slug ? `${window.location.origin}/negocio/${slug}` : null;

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      localStorage.setItem(STEP_KEY(3), 'true');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!url) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="flex-1 bg-slate-900 text-green-400 text-xs px-2 py-1.5 rounded truncate">{url}</code>
      <button
        onClick={copy}
        className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2 py-1.5 rounded transition-colors"
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true',
  );
  const [collapsed, setCollapsed] = useState(false);
  const [, forceRender] = useState(0);

  if (dismissed) return null;
  if (user?.role !== 'OWNER') return null;

  const steps = buildSteps(user?.tenant?.industry);

  function toggleStep(step: Step) {
    if (step.auto || step.isShareStep) return;
    const current = localStorage.getItem(STEP_KEY(step.id)) === 'true';
    localStorage.setItem(STEP_KEY(step.id), (!current).toString());
    forceRender((v) => v + 1);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  const completedCount = steps.filter(isStepDone).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white">
            {allDone ? '🎉 Configuración completada' : 'Comenzar con Automatiza360'}
          </span>
          <span className="text-xs text-slate-400">{completedCount}/{steps.length} pasos</span>
        </div>
        <span className="text-slate-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700">
        <div
          className="h-1 bg-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <div className="px-4 py-3 space-y-3">
          {steps.map((step) => {
            const done = isStepDone(step);
            return (
              <div key={step.id} className={`rounded-lg p-3 transition-colors ${done ? 'bg-slate-900/30' : 'bg-slate-700/30'}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStep(step)}
                    disabled={step.auto || step.isShareStep}
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors ${
                      done
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-500 hover:border-indigo-400'
                    } ${(step.auto || step.isShareStep) ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {done && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {step.label}
                      </span>
                      {step.link && !done && (
                        <Link
                          to={step.link}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0"
                        >
                          {step.linkLabel} →
                        </Link>
                      )}
                    </div>
                    {!done && (
                      <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                    )}
                    {step.isShareStep && !done && (
                      <ShareStepContent slug={user?.tenant?.slug} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2 border-t border-slate-700 flex justify-end">
            <button
              onClick={dismiss}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {allDone ? 'Cerrar definitivamente' : 'No mostrar más'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
