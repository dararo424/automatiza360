import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenuPublico } from '../../api/menuPublico';

function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export function MenuPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['menu-publico', slug],
    queryFn: () => getMenuPublico(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-green-700 text-lg">Cargando menú...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-600">Restaurante no encontrado.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <div className="bg-green-600 text-white py-8 px-4 text-center shadow-lg">
        <h1 className="text-3xl font-black">{data.tenant.name}</h1>
        <p className="text-green-100 mt-2 capitalize">{today}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!data.menu || data.menu.platos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍴</p>
            <p className="text-gray-500 text-lg">No hay menú disponible por hoy.</p>
            <p className="text-gray-400 text-sm mt-2">Vuelve más tarde.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-green-700 mb-6 text-center">Menú del día</h2>
            <div className="grid gap-4">
              {data.menu.platos.map((plato) => (
                <div
                  key={plato.id}
                  className="bg-white rounded-2xl shadow-md p-5 border border-green-100 flex justify-between items-start gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{plato.name}</h3>
                    {plato.description && (
                      <p className="text-gray-500 text-sm mt-1">{plato.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-600 font-black text-xl">{formatCOP(plato.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-gray-400 text-xs mt-10">
          Powered by Automatiza360
        </p>
      </div>
    </div>
  );
}
