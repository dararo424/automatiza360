import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DISMISSED_KEY = 'onboarding_checklist_dismissed';
const STEP_KEY = (n: number) => `onboarding_step_${n}`;

interface Step {
  id: number;
  label: string;
  link?: string;
  linkLabel?: string;
  auto?: boolean; // completed automatically (account creation)
}

const STEPS_RESTAURANT: Step[] = [
  { id: 0, label: 'Creaste tu cuenta', auto: true },
  { id: 1, label: 'Configura tus productos', link: '/productos', linkLabel: 'Ir a Productos' },
  { id: 2, label: 'Conecta tu WhatsApp', link: '/mi-plan', linkLabel: 'Ir a Mi Plan' },
  { id: 3, label: 'Invita a tu equipo', link: '/equipo', linkLabel: 'Ir a Equipo' },
  { id: 4, label: 'Explora el dashboard', link: '/dashboard', linkLabel: 'Ir al Dashboard' },
];

const STEPS_CLINIC: Step[] = [
  { id: 0, label: 'Creaste tu cuenta', auto: true },
  { id: 1, label: 'Configura tus servicios', link: '/agenda', linkLabel: 'Ir a Agenda' },
  { id: 2, label: 'Conecta tu WhatsApp', link: '/mi-plan', linkLabel: 'Ir a Mi Plan' },
  { id: 3, label: 'Invita a tu equipo', link: '/equipo', linkLabel: 'Ir a Equipo' },
  { id: 4, label: 'Explora el dashboard', link: '/dashboard', linkLabel: 'Ir al Dashboard' },
];

function getSteps(industry?: string): Step[] {
  if (industry === 'CLINIC' || industry === 'BEAUTY') return STEPS_CLINIC;
  return STEPS_RESTAURANT;
}

function isStepDone(step: Step): boolean {
  if (step.auto) return true;
  return localStorage.getItem(STEP_KEY(step.id)) === 'true';
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

  const steps = getSteps(user?.tenant?.industry);

  function toggleStep(step: Step) {
    if (step.auto) return;
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

  return (
    <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-slate-800">Comenzar con Automatiza360</span>
          <span className="text-xs text-slate-500">{completedCount}/{steps.length} completados</span>
        </div>
        <span className="text-slate-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-1 bg-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <div className="px-4 py-3 space-y-2">
          {steps.map((step) => {
            const done = isStepDone(step);
            return (
              <div key={step.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleStep(step)}
                  disabled={step.auto}
                  className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 hover:border-indigo-400'
                  } ${step.auto ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {done && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {step.label}
                </span>
                {step.link && !done && (
                  <Link
                    to={step.link}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                  >
                    {step.linkLabel} →
                  </Link>
                )}
              </div>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={dismiss}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Completar y no mostrar más
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
