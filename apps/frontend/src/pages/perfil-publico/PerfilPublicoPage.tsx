import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPerfilPublico } from '../../api/perfilPublico';

const INDUSTRY_LABEL: Record<string, string> = {
  RESTAURANT: 'Restaurante',
  TECH_STORE: 'Tienda Tech',
  CLINIC: 'Clínica',
  BEAUTY: 'Salón de belleza',
  OTHER: 'Negocio',
};

function InitialAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
      {initial}
    </div>
  );
}

export function PerfilPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: perfil, isLoading, isError } = useQuery({
    queryKey: ['perfil-publico', slug],
    queryFn: () => getPerfilPublico(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !perfil) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-700 mb-2">Negocio no encontrado</h1>
          <p className="text-slate-500">La página que buscas no existe o fue desactivada.</p>
        </div>
      </div>
    );
  }

  const waLink = perfil.whatsappNumber
    ? `https://wa.me/${perfil.whatsappNumber.replace(/\D/g, '')}?text=Hola%2C+vi+tu+perfil+en+Automatiza360`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            {perfil.logoUrl ? (
              <img
                src={perfil.logoUrl}
                alt={perfil.nombre}
                className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <InitialAvatar name={perfil.nombre} />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-800">{perfil.nombre}</h1>
          <span className="mt-2 inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
            {INDUSTRY_LABEL[perfil.industria] ?? perfil.industria}
          </span>
          {perfil.descripcion && (
            <p className="mt-3 text-slate-600 text-base leading-relaxed max-w-lg mx-auto">
              {perfil.descripcion}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info cards */}
        {(perfil.horario || perfil.direccion || perfil.ciudad) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {perfil.horario && (
              <div className="flex items-start gap-3 p-4">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Horario</p>
                  <p className="text-slate-700 font-medium">{perfil.horario}</p>
                </div>
              </div>
            )}
            {(perfil.direccion || perfil.ciudad) && (
              <div className="flex items-start gap-3 p-4">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</p>
                  <p className="text-slate-700 font-medium">
                    {[perfil.direccion, perfil.ciudad].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Today's menu (restaurants) */}
        {perfil.menuHoy && perfil.menuHoy.platos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Menú del día</h2>
            <div className="grid gap-3">
              {perfil.menuHoy.platos.map((plato, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{plato.nombre}</p>
                    {plato.descripcion && (
                      <p className="text-sm text-slate-500 truncate">{plato.descripcion}</p>
                    )}
                  </div>
                  <span className="text-green-700 font-bold text-lg shrink-0">
                    ${plato.precio.toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services (clinics/beauty) */}
        {perfil.servicios && perfil.servicios.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Servicios</h2>
            <div className="grid gap-3">
              {perfil.servicios.map((servicio, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{servicio.nombre}</p>
                      {servicio.descripcion && (
                        <p className="text-sm text-slate-500 mt-0.5">{servicio.descripcion}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">Duración: {servicio.duracion} min</p>
                    </div>
                    <span className="text-green-700 font-bold text-lg shrink-0">
                      ${servicio.precio.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp CTA */}
        {waLink && (
          <div className="text-center py-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Escribir por WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>Powered by <span className="font-semibold text-green-600">Automatiza360</span></p>
      </footer>
    </div>
  );
}
