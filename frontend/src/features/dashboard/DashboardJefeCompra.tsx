import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../inventory/inventoryApi';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function KpiCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}

export default function DashboardJefeCompra() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'GERENTE';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'CRITICAL'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // States for the Modal Form
  const [editActual, setEditActual] = useState(0);
  const [editMin, setEditMin] = useState(0);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
    },
  });

  // Fetch inventory items (paginated)
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search],
    queryFn: () => inventoryApi.getAll({
      page,
      limit: 15,
      search: search || undefined,
    }),
  });

  // Fetch KPIs from the dedicated stats endpoint
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryApi.getStats(),
  });

  // Compute total inventory value from current page (approximate, real would be backend)
  const totalValue = useMemo(() => {
    if (!data?.data) return 0;
    return data.data.reduce((acc: number, item: any) => {
      const stock = Number(item.stock_actual) || 0;
      const cost = Number(item.producto?.costo_unitario_sin_iva) || 0;
      return acc + stock * cost;
    }, 0);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((item: any) => {
      const stock = Number(item.stock_actual) || 0;
      const minStock = Number(item.stock_minimo) || 0;
      
      if (statusFilter === 'LOW') return stock > 0 && stock < minStock;
      if (statusFilter === 'CRITICAL') return stock <= 0;
      return true;
    });
  }, [data, statusFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Inventario Interno</h1>
          <p className="text-gray-500 mt-1">Supervisión de stock y necesidades de abastecimiento</p>
        </div>
        <button
          onClick={() => navigate('/planificador')}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          🚀 Ir al Planificador de Compras
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total en Inventario" value={stats?.total_items ?? 0} icon="📦" color="bg-blue-50 text-blue-600" />
        <KpiCard title="Stock Bajo Mínimo" value={stats?.stock_bajo ?? 0} icon="⚠️" color="bg-yellow-50 text-yellow-600" />
        <KpiCard title="Productos Agotados" value={stats?.agotados ?? 0} icon="🚨" color="bg-red-50 text-red-600" />
        <KpiCard title="Valor Inventario (Costo)" value={formatCurrency(totalValue)} icon="💰" color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-1/3 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex bg-gray-200 p-1 rounded-xl">
            {(['ALL', 'LOW', 'CRITICAL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'ALL' ? 'Todos' : s === 'LOW' ? 'Stock Bajo' : 'Crítico'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando inventario...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-600">No hay productos en el inventario interno</p>
            <p className="text-sm mt-1">Agrega productos desde el Maestro usando las Órdenes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Item</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stock Actual</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stock Mínimo</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  {canEdit && <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((item: any) => {
                  const stock = Number(item.stock_actual) || 0;
                  const minStock = Number(item.stock_minimo) || 0;
                  const prod = item.producto;

                  let statusBadge = <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">ÓPTIMO</span>;
                  if (stock <= 0) {
                    statusBadge = <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">AGOTADO</span>;
                  } else if (stock < minStock) {
                    statusBadge = <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">BAJO MÍNIMO</span>;
                  }

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shadow-sm flex items-center justify-center">
                          {prod?.imagen_principal ? (
                            <img src={prod.imagen_principal} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">📦</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-500">{prod?.codigo}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{prod?.nombre}</p>
                        <p className="text-xs text-gray-500">{prod?.presentacion}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">{formatNumber(stock, 0)}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{formatNumber(minStock, 0)}</td>
                      <td className="px-6 py-4 text-center">{statusBadge}</td>
                      {canEdit && (
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => {
                              setSelectedItem(item);
                              setEditActual(Number(stock));
                              setEditMin(Number(minStock));
                            }}
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                          >
                            ✎ Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && data.meta.totalPages > 1 && statusFilter === 'ALL' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {data.meta.page} de {data.meta.totalPages}</p>
            <div className="flex gap-2">
               <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
               <button disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuración */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📦 Editar Inventario
              </h2>
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* Info de Producto */}
              <div className="flex items-center gap-4 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                  {selectedItem.producto?.imagen_principal ? (
                     <img src={selectedItem.producto.imagen_principal} alt={selectedItem.producto.nombre} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-2xl">📦</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedItem.producto?.nombre}</h3>
                  <div className="text-sm font-mono text-gray-500 mt-1 flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{selectedItem.producto?.codigo}</span>
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase text-[10px] tracking-wider">
                      {selectedItem.producto?.presentacion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario Numérico */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Stock Minimo</label>
                  <input
                    type="number"
                    value={editMin === 0 ? '' : editMin}
                    onChange={(e) => setEditMin(Number(e.target.value))}
                    className="w-full text-2xl font-black text-gray-900 bg-transparent outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Stock Actual</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={editActual === 0 ? '' : editActual}
                      onChange={(e) => setEditActual(Number(e.target.value))}
                      className="w-full text-2xl font-black text-gray-900 bg-transparent outline-none"
                      placeholder="0"
                    />
                    <button 
                      onClick={() => setEditActual(prev => Math.max(0, prev - 1))}
                      className="bg-red-100 text-red-600 w-10 h-10 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center shrink-0"
                      title="Descontar 1 unidad"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => setEditActual(prev => prev + 1)}
                      className="bg-green-100 text-green-600 w-10 h-10 rounded-xl font-bold hover:bg-green-200 transition-colors flex items-center justify-center shrink-0"
                      title="Sumar 1 unidad"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggle Habilitado / Quitar */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3 font-medium">Opciones avanzadas:</p>
                <div className="flex justify-between items-center bg-red-50 p-4 rounded-2xl border border-red-100">
                  <div>
                    <h4 className="font-bold text-red-700 text-sm">Deshabilitar del Sistema Local</h4>
                    <p className="text-xs text-red-600/70 mt-0.5">Retira este producto de la vista del Jefe de Compra.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Seguro de remover este producto del inventario interno? Podrás agregarlo de nuevo usando una orden de compra.')) {
                        removeMutation.mutate(selectedItem.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-sm shadow-red-200 transition-colors"
                  >
                    🗑 Retirar Definitivo
                  </button>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end rounded-b-3xl">
               <button 
                 onClick={() => setSelectedItem(null)}
                 className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => {
                   updateMutation.mutate({ 
                     id: selectedItem.id, 
                     data: { stock_actual: editActual, stock_minimo: editMin } 
                   });
                 }}
                 disabled={updateMutation.isPending}
                 className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
               >
                 {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
