import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'PRO' | 'BUSINESS';
  description?: string;
}

export function UpgradePrompt({ feature, requiredPlan, description }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-white mb-2">{feature}</h2>
      <p className="text-slate-400 mb-1">
        Esta función requiere el plan{' '}
        <span className={requiredPlan === 'BUSINESS' ? 'text-amber-400 font-semibold' : 'text-indigo-400 font-semibold'}>
          {requiredPlan}
        </span>
      </p>
      {description && <p className="text-slate-500 text-sm mb-6">{description}</p>}
      {!description && <p className="text-slate-500 text-sm mb-6">Actualiza tu plan para acceder a esta funcionalidad.</p>}
      <Link
        to="/planes"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
      >
        Ver planes →
      </Link>
    </div>
  );
}
