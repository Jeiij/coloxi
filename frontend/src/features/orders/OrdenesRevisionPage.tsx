import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderApi } from './orderApi';
import { formatDate } from '../../lib/utils';

const estadoBadge: Record<string, string> = {
  ENVIADA: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

export default function OrdenesRevisionPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState('ENVIADA'); // Default to ENVIADA

  const { data, isLoading } = useQuery({
    queryKey: ['orders-revision', page, estado],
    queryFn: () => orderApi.getAll({ page, limit: 15, estado }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes en Revisión</h1>
          <p className="text-gray-500 text-sm mt-1">
            Historial de órdenes enviadas para aprobación y finalizadas. ({data?.meta?.total ?? 0})
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <select 
          value={estado} 
          onChange={(e) => { setEstado(e.target.value); setPage(1); }} 
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ENVIADA">Pendientes por Aprobación</option>
          <option value="FINALIZADA">Aprobadas / Finalizadas</option>
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
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ítems</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((o) => (
                <tr key={o.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-blue-600">{o.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(o.fecha)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoBadge[o.estado] || 'bg-gray-100'}`}>
                      {o.estado === 'ENVIADA' ? 'PENDIENTE POR APROBACIÓN' : o.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{o.mercado}</td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-gray-700">{o._count?.detalles ?? 0}</td>
                  <td className="px-6 py-4 text-center">
                    <Link to={`/ordenes/${o.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold">
                      Detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {(!data?.data || data.data.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay órdenes en este estado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Paginación */}
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
