import { useState } from 'react';

interface QrCardProps {
  url: string;
  label?: string;
}

export function QrCard({ url, label }: QrCardProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&color=101b10&bgcolor=ffffff&margin=1`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function download() {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&color=101b10&bgcolor=ffffff&margin=2&format=png`;
    link.download = 'qr-mi-negocio.png';
    link.target = '_blank';
    link.click();
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-5">
        <div className="shrink-0 bg-white p-2 rounded-xl border-2 border-ink shadow-pop-sm">
          <img
            src={qrSrc}
            alt="QR code de tu negocio"
            width={120}
            height={120}
            className="block"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="label-mono mb-1">Código QR de tu negocio</p>
          <p className="text-slate-500 text-xs mb-3">
            Pégalo en tu mostrador, menú, tarjeta de presentación o redes sociales para que los clientes te escriban directo.
          </p>
          {label && (
            <p className="text-selva-600 text-xs mb-3 font-mono truncate">{label}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copy}
              className="bg-ink hover:bg-selva-900 text-lima text-xs font-semibold px-3 py-1.5 rounded-lg border border-ink transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar enlace'}
            </button>
            <button
              onClick={download}
              className="bg-white hover:bg-bone-soft text-ink text-xs font-semibold px-3 py-1.5 rounded-lg border border-bone-deep hover:border-ink transition-colors"
            >
              Descargar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
