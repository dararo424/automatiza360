import { useState } from 'react';

interface QrCardProps {
  url: string;
  label?: string;
}

export function QrCard({ url, label }: QrCardProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&color=4f46e5&bgcolor=ffffff&margin=1`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function download() {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&color=4f46e5&bgcolor=ffffff&margin=2&format=png`;
    link.download = 'qr-mi-negocio.png';
    link.target = '_blank';
    link.click();
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start gap-5">
        <div className="shrink-0 bg-white p-2 rounded-xl shadow-lg">
          <img
            src={qrSrc}
            alt="QR code de tu negocio"
            width={120}
            height={120}
            className="block"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm mb-1">Código QR de tu negocio</p>
          <p className="text-slate-400 text-xs mb-3">
            Pégalo en tu mostrador, menú, tarjeta de presentación o redes sociales para que los clientes te escriban directo.
          </p>
          {label && (
            <p className="text-indigo-300 text-xs mb-3 font-mono truncate">{label}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copy}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar enlace'}
            </button>
            <button
              onClick={download}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Descargar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
