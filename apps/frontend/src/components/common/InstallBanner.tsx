import { useState } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DISMISSED_KEY = 'installBannerDismissed';

export function InstallBanner() {
  const { canInstall, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  if (!canInstall || dismissed) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">📱</span>
        <p className="text-sm font-medium">Instala Automatiza360 como app</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={install}
          className="bg-white text-green-700 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white text-lg leading-none px-1"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
