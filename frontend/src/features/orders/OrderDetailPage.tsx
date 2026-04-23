import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from './orderApi';
import { productApi } from '../products/productApi';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Product } from '../../types';

const estadoBadge: Record<string, string> = {
  BORRADOR: 'bg-yellow-100 text-yellow-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isJefeCompra = user?.rol === 'JEFE_COMPRA';

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [colorId, setColorId] = useState<number>(0);
  const [cantidad, setCantidad] = useState(1);
  const [searchProd, setSearchProd] = useState('');
  const [pvpVenezuelaManual, setPvpVenezuelaManual] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Queries
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id!),
    enabled: !!id,
  });

  const { data: productsList } = useQuery({
    queryKey: ['products-select', searchProd],
    queryFn: () => productApi.getAll({ search: searchProd || undefined, limit: 50 }),
  });

  // Cargar detalle del producto seleccionado (con colores)
  const { data: productDetail } = useQuery({
    queryKey: ['product-detail', selectedProduct?.id],
    queryFn: () => productApi.getById(selectedProduct!.id),
    enabled: !!selectedProduct?.id,
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: () => orderApi.addItem(id!, { 
      producto_id: selectedProduct!.id, 
      color_id: colorId || undefined, 
      cantidad,
      pvp_venezuela: pvpVenezuelaManual ? Number(pvpVenezuelaManual) : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setSelectedProduct(null);
      setColorId(0);
      setCantidad(1);
      setSearchProd('');
      setPvpVenezuelaManual('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => orderApi.removeItem(id!, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (estado: string) => orderApi.updateStatus(id!, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: (obs: string) => orderApi.update(id!, { observaciones: obs }),
    onSuccess: () => {
      alert('Observaciones guardadas exitosamente');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  // Handlers
  const handleSelectProduct = (prodId: string) => {
    const prod = productsList?.data?.find((p) => p.id === prodId) || null;
    setSelectedProduct(prod);
    setColorId(0); // Reset color al cambiar producto
  };

  if (isLoading) return <div className="text-center text-gray-400 py-12">Cargando orden...</div>;
  if (!order) return <div className="text-center text-gray-400 py-12">Orden no encontrada</div>;

  const isBorrador = order.estado === 'BORRADOR';
  const coloresDisponibles = (productDetail as any)?.colores || [];

  // Calcular totales del resumen
  const totals = (order.detalles || []).reduce(
    (acc, d) => ({
      galones: acc.galones + parseFloat(d.total_galones),
      kgs: acc.kgs + parseFloat(d.total_kgs),
      costoSinIva: acc.costoSinIva + parseFloat(d.costo_total_sin_iva),
      costoConIva: acc.costoConIva + parseFloat(d.costo_total_con_iva),
      pvpCol: acc.pvpCol + parseFloat(d.pvp_colombia_total),
      pvpVzla: acc.pvpVzla + parseFloat(d.pvp_venezuela_total),
    }),
    { galones: 0, kgs: 0, costoSinIva: 0, costoConIva: 0, pvpCol: 0, pvpVzla: 0 },
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabecera Tipo Banner */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className={`absolute top-0 left-0 w-2 h-full ${
          order.estado === 'BORRADOR' ? 'bg-yellow-400' : 
          order.estado === 'ENVIADA' ? 'bg-blue-500' : 'bg-green-500'
        }`} />
        
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shadow-inner">
              {order.estado === 'FINALIZADA' ? '✅' : '📝'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight font-mono">{order.codigo}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${estadoBadge[order.estado] || 'bg-gray-100'}`}>
                  {order.estado}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1 font-medium italic">
                {order.mercado === 'AMBOS' ? '🌍 Mercado Global' : `📍 Mercado ${order.mercado}`} · 
                {formatDate(order.created_at)} por <span className="text-gray-700 font-bold">{order.creator?.nombre_completo ?? '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isBorrador && (isJefeCompra || user?.rol === 'ADMIN' || user?.rol === 'GERENTE') && (
              <button 
                onClick={() => statusMutation.mutate('ENVIADA')} 
                disabled={statusMutation.isPending}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                {statusMutation.isPending ? '...' : <><span className="text-lg">📤</span> Enviar a Aprobación</>}
              </button>
            )}
            {order.estado === 'ENVIADA' && !isJefeCompra && (
              <>
                <button 
                  onClick={() => statusMutation.mutate('FINALIZADA')} 
                  disabled={statusMutation.isPending}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                >
                  {statusMutation.isPending ? '...' : <><span className="text-lg">✅</span> Aprobar Orden</>}
                </button>
                <button 
                  onClick={() => { if(window.confirm('¿Seguro quieres rechazar la orden?')) statusMutation.mutate('RECHAZADA') }} 
                  disabled={statusMutation.isPending}
                  className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  {statusMutation.isPending ? '...' : '❌ Recusar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sección de Observaciones Integrada */}
        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
           <div className="shrink-0 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <span className="text-lg">💬</span> Observaciones:
           </div>
           <div className="flex-1 flex gap-3">
              <input 
                type="text"
                value={observaciones !== '' ? observaciones : (order.observaciones || '')} 
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={isBorrador ? "Añade notas importantes aquí..." : "Sin observaciones"}
                disabled={!isBorrador}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none border-none focus:ring-0 placeholder:italic p-0"
              />
              {isBorrador && (observaciones !== '' && observaciones !== order.observaciones) && (
                <button 
                  onClick={() => updateOrderMutation.mutate(observaciones)}
                  disabled={updateOrderMutation.isPending}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                >
                  [Guardar Cambios]
                </button>
              )}
           </div>
        </div>
      </div>

      {statusMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          {(statusMutation.error as any)?.response?.data?.message || 'Error al cambiar estado de la orden.'}
        </div>
      )}

      {/* Agregar ítems (solo borrador) */}
      {isBorrador && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Agregar Producto a la Orden</h2>
            <p className="text-sm text-gray-500 mt-1">Busca el código o nombre y configúralo antes de añadir.</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buscador de Producto */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">1. Buscar Producto</label>
              <input
                type="text"
                placeholder="Escribe para buscar..."
                value={searchProd}
                onChange={(e) => setSearchProd(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm mb-3"
              />
              
              <div className="h-[280px] overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-2">
                {productsList?.data?.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => handleSelectProduct(p.id)}
                    className={`flex items-center gap-3 p-3 mb-1.5 rounded-xl cursor-pointer transition-colors border ${
                      selectedProduct?.id === p.id 
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm' 
                        : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-black/5">
                      {p.imagen_principal ? (
                        <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{p.codigo}</p>
                      <p className="text-xs text-gray-500 truncate">{p.nombre}</p>
                    </div>
                  </div>
                ))}
                {(!productsList?.data || productsList.data.length === 0) && (
                  <div className="p-8 text-center text-gray-400 text-sm">No se encontraron productos...</div>
                )}
              </div>
            </div>

            {/* Configuración del Producto Seleccionado */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">2. Configurar Detalles</label>
              
              {!selectedProduct ? (
                <div className="h-[340px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400">
                  <span className="text-4xl mb-3">👈</span>
                  <p className="text-sm font-medium">Selecciona un producto de la lista</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white">
                  {addMutation.isError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {(addMutation.error as any)?.response?.data?.message || 'Error al agregar el ítem.'}
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                      {(selectedProduct as any).imagen_principal ? (
                        <img src={(selectedProduct as any).imagen_principal} alt={selectedProduct.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {selectedProduct.presentacion}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1 leading-tight">{selectedProduct.nombre}</h3>
                      <p className="text-sm font-mono text-gray-500 mt-0.5">{selectedProduct.codigo}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Colores */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Select Color *</label>
                        {colorId !== 0 && (
                          <span className="text-xs font-medium text-gray-500">
                            {coloresDisponibles.find((c: any) => c.id === colorId)?.nombre}
                          </span>
                        )}
                      </div>
                      
                      {coloresDisponibles.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {coloresDisponibles.map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => setColorId(c.id)}
                              className={`w-9 h-9 rounded-full transition-all focus:outline-none ring-offset-2 ${
                                colorId === c.id ? 'ring-2 ring-blue-600 scale-110 shadow-sm' : 'ring-1 ring-gray-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.codigo_hex }}
                              title={c.nombre}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded border border-blue-100 italic">Este producto no requiere selección de color.</p>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Cantidad</label>
                      <div className="flex items-center inline-flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button onClick={() => setCantidad(c => Math.max(1, (Number(c) || 1) - 1))} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition font-bold text-xl">-</button>
                        <input 
                          type="text" 
                          value={cantidad}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCantidad(val as any);
                          }}
                          onBlur={() => { if(!cantidad || Number(cantidad) < 1) setCantidad(1); }}
                          className="w-16 h-12 text-center font-bold text-gray-900 border-x border-gray-200 focus:outline-none appearance-none text-lg"
                        />
                        <button type="button" onClick={() => setCantidad(c => (Number(c) || 0) + 1)} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition font-bold text-xl">+</button>
                      </div>
                    </div>

                    {/* PVP Venezuela Manual */}
                    {!isJefeCompra && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">PVP Venezuela (Opcional)</label>
                        <input 
                          type="text"
                          placeholder="Sugerido por factor..."
                          value={pvpVenezuelaManual}
                          onChange={(e) => setPvpVenezuelaManual(e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, ''))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Si se deja vacío, usa PVP COL * Factor</p>
                      </div>
                    )}

                    <button
                      onClick={() => addMutation.mutate()}
                      disabled={(coloresDisponibles.length > 0 && !colorId) || addMutation.isPending}
                      className="w-full mt-2 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black disabled:opacity-50 transition-all shadow-lg shadow-black/10"
                    >
                      {addMutation.isPending ? 'Procesando...' : '⭐ Añadir Ítem a la Orden'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de ítems */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Detalle de Ítems ({order.detalles?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Color</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cant.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Costo s/IVA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Costo c/IVA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase bg-blue-50/30">PVP COL</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-purple-600 uppercase bg-purple-50/30">PVP VEN</th>
                {!isJefeCompra && (
                  <>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-green-700 uppercase bg-green-50/30">Gan. Neta COL</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-fuchsia-700 uppercase bg-fuchsia-50/30">Gan. VEN</th>
                  </>
                )}
                {isBorrador && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.detalles?.map((d) => (
                <tr key={d.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.producto_nombre}</p>
                    <p className="text-xs text-gray-400">{d.producto_codigo} · {d.presentacion}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{d.color_nombre}</td>
                  <td className="px-4 py-3 text-right">{d.cantidad}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(d.costo_total_sin_iva)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(d.costo_total_con_iva)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/10">{formatCurrency(d.pvp_colombia_total)}</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50/10">{formatCurrency(d.pvp_venezuela_total)}</td>
                  
                  {!isJefeCompra && (
                    <>
                      <td className="px-4 py-3 text-right text-emerald-700 font-bold bg-green-50/10">
                        {formatCurrency(d.ganancia_colombia_neta_total ?? '0')}
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5">{d.margen_colombia_porcentaje}% M.B</div>
                      </td>
                      <td className="px-4 py-3 text-right text-fuchsia-700 font-bold bg-fuchsia-50/10">
                        {formatCurrency(d.ganancia_venezuela_total ?? '0')}
                      </td>
                    </>
                  )}
                  {isBorrador && (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeMutation.mutate(d.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">🗑</button>
                    </td>
                  )}
                </tr>
              ))}
              {(!order.detalles || order.detalles.length === 0) && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No hay ítems en esta orden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Impacto Financiero (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Volumen de Compra</p>
            <div className="space-y-1">
              <p className="text-2xl font-black text-gray-900">{totals.galones.toFixed(2)} <span className="text-sm font-medium text-gray-500">Gal</span></p>
              <p className="text-sm font-bold text-blue-600">{totals.kgs.toFixed(2)} kg <span className="text-xs font-medium text-gray-400">Peso Total</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Inversión Total (Costo)</p>
            <div className="space-y-1">
              <p className="text-2xl font-black text-gray-900">{formatCurrency(totals.costoConIva)}</p>
              <p className="text-xs font-medium text-gray-400">Iva incl. / Basado en {formatCurrency(totals.costoSinIva)} neto</p>
            </div>
          </div>

          {!isJefeCompra && (
            <>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-100 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700">📈</div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2">Ganancia Operativa COL</p>
                <p className="text-3xl font-black">
                  {formatCurrency((order.detalles || []).reduce((sum, d) => sum + parseFloat(String(d.ganancia_colombia_neta_total || 0)), 0))}
                </p>
                <p className="text-xs font-medium text-emerald-100 mt-2">Cálculo basado en PVP Colombia Total</p>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-6 rounded-3xl shadow-lg shadow-fuchsia-100 text-white relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700">🇻🇪</div>
                <p className="text-xs font-bold text-fuchsia-100 uppercase tracking-widest mb-2">Proyección Ganancia VZLA</p>
                <p className="text-3xl font-black">
                  {formatCurrency((order.detalles || []).reduce((sum, d) => sum + parseFloat(String(d.ganancia_venezuela_total || 0)), 0))}
                </p>
                <p className="text-xs font-medium text-fuchsia-100 mt-2">Basado en Factor y PVP Venezuela</p>
              </div>
            </>
          )}

          {isJefeCompra && (
            <>
               <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Valor Mercadeo (PVP COL)</p>
                  <p className="text-2xl font-black text-blue-700">{formatCurrency(totals.pvpCol)}</p>
               </div>
               <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Valor Mercadeo (PVP VZLA)</p>
                  <p className="text-2xl font-black text-purple-700">{formatCurrency(totals.pvpVzla)}</p>
               </div>
            </>
          )}
      </div>
    </div>
  );
}
