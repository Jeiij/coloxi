import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { productApi } from './productApi';
import { orderApi } from '../orders/orderApi';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import ProductSlideOver from './components/ProductSlideOver';
import ProductRowCard, { ProductRowMetric, ProductRowTag } from '../../components/ProductRowCard';

export default function ProductListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isJefeCompra = user?.rol === 'JEFE_COMPRA';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoriaId] = useState('');
  const [lineaId] = useState('');
  const [marcaId] = useState('');

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoriaId, lineaId, marcaId, mostrarInactivos],
    queryFn: () => productApi.getAll({
      page,
      limit: 15,
      search: search || undefined,
      activo: mostrarInactivos ? 'all' : true,
    }),
  });



  // Buscar si hay borrador activo para mostrar banner
  const { data: draftOrdersResponse } = useQuery({
    queryKey: ['draft-orders-banner'],
    queryFn: () => orderApi.getAll({ estado: 'BORRADOR', limit: 1 }),
  });
  const activeDraft = draftOrdersResponse?.data?.[0];



  return (
    <div>
      {/* Banner de Borrador Activo */}
      {isJefeCompra && activeDraft && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Tienes una orden en borrador en curso</p>
              <p className="text-xs text-blue-700 mt-0.5">Orden: {activeDraft.codigo || activeDraft.id.split('-')[0]}</p>
            </div>
          </div>
          <Link 
            to={`/ordenes/${activeDraft.id}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition"
          >
            Ir a la Orden
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isJefeCompra ? 'Inventario' : 'Maestro de Productos'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.meta?.total ?? 0} productos encontrados
          </p>
        </div>
        {!isJefeCompra && (
          <button
            onClick={() => navigate('/productos/nuevo')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Nuevo Producto
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <input
            type="text"
            placeholder="Buscar por código o nombre del producto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:max-w-md px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-4">
            {!isJefeCompra && (
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => { setMostrarInactivos(e.target.checked); setPage(1); }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-gray-700">Ver Inhabilitados</span>
              </label>
            )}
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando productos...</div>
        ) : (
          <div className="space-y-3 p-4">
            {data?.data?.map((p) => {
              
              const tags: ProductRowTag[] = [];
              if (p.activo) {
                tags.push({ label: 'Activo', colorClass: 'bg-green-100 text-green-800' });
              } else {
                tags.push({ label: 'Inactivo', colorClass: 'bg-red-100 text-red-800' });
              }
              tags.push({ label: p.presentacion, colorClass: 'bg-gray-100 text-gray-600' });

              const metrics: ProductRowMetric[] = [
                { label: 'Costo Base', value: formatCurrency(p.costo_unitario_sin_iva) },
                { label: 'PVP Colombia', value: formatCurrency(p.pvp_colombia), valueClass: 'text-emerald-600 font-bold' },
                { label: 'PVP Venezuela', value: formatCurrency(p.pvp_venezuela), valueClass: 'text-purple-600 font-bold' },
              ];

              const actions = (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {isJefeCompra ? (
                    <button 
                      onClick={() => setSelectedProductId(p.id)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Añadir a Orden
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/productos/${p.id}/editar`)}
                      title="Editar producto"
                      className="px-4 py-2 bg-white text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm text-xs font-bold flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                  )}
                </div>
              );

              return (
                <ProductRowCard
                  key={p.id}
                  code={p.codigo}
                  name={p.nombre}
                  image={p.imagen_principal ? getImageUrl(p.imagen_principal) : null}
                  tags={tags}
                  metrics={metrics}
                  actions={actions}
                  dimmed={!p.activo}
                  onClick={() => navigate(`/historial-precios?productoId=${p.id}`)}
                />
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {data.meta.page} de {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Anterior</button>
              <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <ProductSlideOver 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    </div>
  );
}
