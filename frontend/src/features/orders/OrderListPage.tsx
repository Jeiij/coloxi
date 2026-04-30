import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderApi } from './orderApi';
import { formatDate } from '../../lib/utils';
import OrderRowCard from '../../components/OrderRowCard';

const estadoBadge: Record<string, string> = {
  BORRADOR: 'bg-yellow-100 text-yellow-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

const estadoLabel: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Pendiente Aprobación',
  FINALIZADA: 'Finalizada',
  RECHAZADA: 'Rechazada',
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
          <option value="ENVIADA">Pendiente por Aprobación</option>
          <option value="FINALIZADA">Finalizada</option>
          <option value="RECHAZADA">Rechazada</option>
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">Cargando órdenes...</div>
        ) : data?.data?.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">No hay órdenes que mostrar.</div>
        ) : (
          data?.data?.map((o) => {
            const actions = (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/ordenes/${o.id}`)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition shadow-sm text-center whitespace-nowrap"
                >
                  Ver detalle →
                </button>
                {o.estado === 'BORRADOR' && (
                  <button
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas eliminar este borrador? Esta acción no se puede deshacer.')) {
                        deleteMutation.mutate(o.id);
                      }
                    }}
                    className="px-4 py-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-700 border border-red-100 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                    title="Eliminar borrador"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            );

            return (
              <OrderRowCard
                key={o.id}
                codigo={o.codigo}
                fecha={formatDate(o.fecha)}
                creadoPor={o.creator?.nombre_completo}
                totalItems={o._count?.detalles ?? 0}
                estadoBadgeClass={estadoBadge[o.estado] || 'bg-gray-100 text-gray-700'}
                estadoLabel={estadoLabel[o.estado] || o.estado}
                actions={actions}
                onClick={() => navigate(`/ordenes/${o.id}`)}
              />
            );
          })
        )}
      </div>

      {/* Paginación */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-500">Página {data.meta.page} de {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 bg-white shadow-sm">Anterior</button>
            <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 bg-white shadow-sm">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}

