import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { inventoryApi } from '../inventory/inventoryApi';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import ProductRowCard, { ProductRowMetric, ProductRowTag } from '../../components/ProductRowCard';

function KpiCard({ title, value, icon, color, subValue }: { title: string; value: string | number; icon: React.ReactNode; color: string; subValue?: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color} shadow-inner`}>
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        {subValue && <p className="text-xs font-medium text-emerald-500 mt-2">{subValue}</p>}
      </div>
    </div>
  );
}

const KpiIcons = {
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Danger: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  Value: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function DashboardJefeCompra() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canEdit = user?.rol === 'ADMIN' || user?.rol === 'GERENTE';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW'>('ALL');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // States for the Modal Form
  const [editActual, setEditActual] = useState(0);
  const [editMin, setEditMin] = useState(0);
  const [editActivo, setEditActivo] = useState(true);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItem(null);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Ocurrió un error al actualizar el inventario.');
    }
  });



  // Fetch inventory items (paginated)
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, mostrarInactivos],
    queryFn: () => inventoryApi.getAll({
      page,
      limit: 15,
      search: search || undefined,
      activo: mostrarInactivos ? 'all' : true,
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
      return true;
    });
  }, [data, statusFilter]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventario</h1>
        <p className="text-gray-500 mt-1">Supervisión de stock y necesidades de abastecimiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <KpiCard title="Items en Inventario" value={stats?.total_items ?? 0} icon={<KpiIcons.Box />} color="bg-blue-50 text-blue-600" subValue="Control local activo" />
        <KpiCard title="Bajo Mínimo" value={stats?.stock_bajo ?? 0} icon={<KpiIcons.Alert />} color="bg-yellow-50 text-yellow-600" subValue="Requiere atención" />
        <KpiCard title="Agotados" value={stats?.agotados ?? 0} icon={<KpiIcons.Danger />} color="bg-red-50 text-red-600" subValue="Acción inmediata" />
        <KpiCard title="Valor Invertido" value={formatCurrency(totalValue)} icon={<KpiIcons.Value />} color="bg-emerald-50 text-emerald-600" subValue="Estimado actual" />
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
          <div className="flex items-center gap-4">
            {canEdit && (
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
            <div className="flex bg-gray-200 p-1 rounded-xl">
              {(['ALL', 'LOW'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s === 'ALL' ? 'Todos' : 'Stock Bajo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando inventario...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            No hay productos en el inventario.
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {filteredData.map((item: any) => {
              const stock = Number(item.stock_actual) || 0;
              const minStock = Number(item.stock_minimo) || 0;
              const prod = item.producto;

              const tags: ProductRowTag[] = [];
              if (stock <= 0) {
                tags.push({ label: 'Agotado', colorClass: 'bg-red-100 text-red-800' });
              } else if (stock < minStock) {
                tags.push({ label: 'Bajo Mínimo', colorClass: 'bg-yellow-100 text-yellow-800' });
              } else {
                tags.push({ label: 'Óptimo', colorClass: 'bg-green-100 text-green-800' });
              }
              if (prod?.presentacion) {
                tags.push({ label: prod.presentacion, colorClass: 'bg-gray-100 text-gray-600' });
              }

              const metrics: ProductRowMetric[] = [
                { 
                  label: 'Stock Actual', 
                  value: stock.toString(), 
                  valueClass: stock <= 0 ? 'text-red-600' : stock < minStock ? 'text-yellow-600' : 'text-gray-900' 
                },
                { label: 'Stock Mínimo', value: minStock.toString(), valueClass: 'text-gray-500' },
                { 
                  label: 'Valor Inventario', 
                  value: formatCurrency(stock * (Number(prod?.costo_unitario_sin_iva) || 0)),
                  valueClass: 'text-blue-600'
                }
              ];

              const actions = canEdit ? (
                <button 
                  onClick={() => {
                    setSelectedItem(item);
                    setEditActual(Number(stock));
                    setEditMin(Number(minStock));
                    setEditActivo(item.activo);
                  }}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-xl hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar
                </button>
              ) : null;

              return (
                <ProductRowCard
                  key={item.id}
                  code={prod?.codigo || '---'}
                  name={prod?.nombre || 'Producto Desconocido'}
                  image={prod?.imagen_principal ? getImageUrl(prod.imagen_principal) : null}
                  tags={tags}
                  metrics={metrics}
                  actions={actions}
                  dimmed={!item.activo}
                />
              );
            })}
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
                     <img src={getImageUrl(selectedItem.producto.imagen_principal) || ''} alt={selectedItem.producto.nombre} className="w-full h-full object-cover" />
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
                  </div>
                </div>
              </div>

              {/* Toggle Habilitado / Quitar */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3 font-medium">Opciones avanzadas:</p>
                <div className={`flex justify-between items-center p-4 rounded-2xl border ${!editActivo ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div>
                    <h4 className={`font-bold text-sm ${!editActivo ? 'text-red-700' : 'text-green-700'}`}>Estado del Sistema Local</h4>
                    <p className={`text-xs mt-0.5 ${!editActivo ? 'text-red-600/70' : 'text-green-600/70'}`}>
                      {!editActivo ? 'Oculta este producto temporalmente de la vista.' : 'Producto visible e inventariado para reponer.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setEditActivo(!editActivo)}
                    className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-colors ${!editActivo ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                  >
                    {!editActivo ? '🚫 Inhabilitado' : '✅ Habilitado'}
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
                     data: { stock_actual: editActual, stock_minimo: editMin, activo: editActivo } 
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
