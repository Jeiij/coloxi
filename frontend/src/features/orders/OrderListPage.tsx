import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from './orderApi';
import { formatDate } from '../../lib/utils';

const estadoBadge: Record<string, string> = {
  BORRADOR: 'bg-yellow-100 text-yellow-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
};

export default function OrderListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('');

  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orderApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const createMutation = useMutation({
    mutationFn: () => orderApi.create({ mercado: 'AMBOS' }),
    onSuccess: (order) => navigate(`/ordenes/${order.id}`),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, estado],
    queryFn: () => orderApi.getAll({ page, limit: 15, estado: estado || undefined }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.meta?.total ?? 0} órdenes</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creando...' : '+ Nueva Orden'}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="ENVIADA">Enviada</option>
          <option value="FINALIZADA">Finalizada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando órdenes...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mercado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Creado por</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ítems</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((o) => (
                <tr key={o.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-blue-600">{o.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(o.fecha)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoBadge[o.estado] || 'bg-gray-100'}`}>
                      {o.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{o.mercado}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{o.creator?.nombre_completo ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-center">{o._count?.detalles ?? 0}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Link to={`/ordenes/${o.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Ver detalle →
                      </Link>
                      {o.estado === 'BORRADOR' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('¿Seguro que deseas eliminar este borrador? Esta acción no se puede deshacer.')) {
                              deleteMutation.mutate(o.id);
                            }
                          }}
                          className="text-sm text-red-500 hover:text-red-700 font-medium"
                          title="Eliminar borrador"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {data.meta.page} de {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
