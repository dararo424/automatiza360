import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LegalLayoutProps {
  label: string;
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalLayout({ label, title, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-bone">
      <header className="bg-ink">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-0.5 select-none">
            <span className="font-display text-xl font-bold tracking-tight text-bone">automatiza</span>
            <span className="font-display text-xl font-bold tracking-tight text-lima">360°</span>
          </Link>
          <Link
            to="/onboarding"
            className="text-sm font-semibold text-lima hover:underline underline-offset-2"
          >
            Crear cuenta →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="label-mono mb-2">{label}</p>
        <h1 className="font-display text-4xl font-bold text-ink mb-2">{title}</h1>
        <p className="font-mono text-xs text-slate-500 mb-10">Última actualización: {updatedAt}</p>

        <article className="legal-body space-y-6 text-[15px] leading-relaxed text-ink-soft">
          {children}
        </article>

        <footer className="mt-16 pt-8 border-t border-bone-deep text-sm text-slate-500">
          <p>
            ¿Dudas sobre este documento? Escríbenos a{' '}
            <a href="mailto:soporteautomatiza360@rgytgroup.com" className="text-selva-600 font-medium hover:underline">
              soporteautomatiza360@rgytgroup.com
            </a>
          </p>
          <div className="mt-3 flex gap-4">
            <Link to="/terminos" className="hover:text-ink hover:underline">Términos y Condiciones</Link>
            <Link to="/privacidad" className="hover:text-ink hover:underline">Política de Privacidad</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function LegalSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-ink mt-10 mb-3 flex items-baseline gap-2">
        <span className="font-mono text-sm text-selva-600">{number}.</span> {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
