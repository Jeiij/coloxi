import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { productApi, catalogApi } from './productApi';
import { orderApi } from '../orders/orderApi';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/utils';
import ProductSlideOver from './components/ProductSlideOver';

export default function ProductListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isJefeCompra = user?.rol === 'JEFE_COMPRA';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [lineaId, setLineaId] = useState('');
  const [marcaId, setMarcaId] = useState('');

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoriaId, lineaId, marcaId],
    queryFn: () => productApi.getAll({
      page,
      limit: 15,
      search: search || undefined,
      categoria_id: categoriaId || undefined,
      linea_id: lineaId || undefined,
      marca_id: marcaId || undefined,
    }),
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const { data: lines } = useQuery({ queryKey: ['lines'], queryFn: catalogApi.getLines });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: catalogApi.getBrands });

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

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">Todas las categorías</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={lineaId} onChange={(e) => { setLineaId(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">Todas las líneas</option>
            {lines?.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          <select value={marcaId} onChange={(e) => { setMarcaId(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="">Todas las marcas</option>
            {brands?.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando productos...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase w-16">Item</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Presentación</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Costo (Sin IVA)</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">PVP (COL)</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shadow-sm flex items-center justify-center">
                      {p.imagen_principal ? (
                        <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-blue-600">{p.codigo}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.presentacion}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-600">
                    {formatCurrency(p.costo_unitario_sin_iva)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                    {formatCurrency(p.pvp_colombia)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isJefeCompra ? (
                      <button 
                        onClick={() => setSelectedProductId(p.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Añadir
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/productos/${p.id}/editar`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
