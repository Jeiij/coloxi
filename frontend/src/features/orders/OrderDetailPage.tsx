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
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.codigo}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Creada el {formatDate(order.created_at)} por {order.creator?.nombre_completo ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${estadoBadge[order.estado]}`}>
              {order.estado}
            </span>
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
              {order.mercado === 'COLOMBIA' ? '🇨🇴' : '🇻🇪'} {order.mercado}
            </span>
          </div>
        </div>
        {/* Cambio de estado */}
        <div className="mt-4 flex gap-2">
          {isBorrador && (isJefeCompra || user?.rol === 'ADMIN' || user?.rol === 'GERENTE') && (
            <button 
              onClick={() => statusMutation.mutate('ENVIADA')} 
              disabled={statusMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {statusMutation.isPending ? 'Procesando...' : '📤 Enviar a Aprobación'}
            </button>
          )}
          {order.estado === 'ENVIADA' && !isJefeCompra && (
            <button 
              onClick={() => statusMutation.mutate('FINALIZADA')} 
              disabled={statusMutation.isPending}
              className="px-4 py-2 text-sm bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {statusMutation.isPending ? 'Procesando...' : '✅ Aprobar y Finalizar Orden'}
            </button>
          )}
        </div>
        
        {statusMutation.isError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {(statusMutation.error as any)?.response?.data?.message || 'Error al cambiar estado de la orden.'}
          </div>
        )}
      </div>

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
                          onChange={(e) => setPvpVenezuelaManual(e.target.value.replace(/[^0-9.]/g, ''))}
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
                {order.mercado === 'COLOMBIA' ? (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase bg-blue-50/30">PVP COL</th>
                ) : (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-purple-600 uppercase bg-purple-50/30">PVP VEN</th>
                )}
                {!isJefeCompra && (
                  <>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">G. Bruta</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">G. Neta</th>
                    {order.mercado === 'VENEZUELA' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">C. Adj. Vzla</th>}
                    {order.mercado === 'VENEZUELA' ? (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase italic">PVP COL</th>
                    ) : (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase italic">PVP VEN</th>
                    )}
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
                  {order.mercado === 'COLOMBIA' ? (
                    <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/10">{formatCurrency(d.pvp_colombia_total)}</td>
                  ) : (
                    <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50/10">{formatCurrency(d.pvp_venezuela_total)}</td>
                  )}
                  
                  {!isJefeCompra && (
                    <>
                      <td className="px-4 py-3 text-right">
                        <p className="text-green-700 font-medium">{formatCurrency(d.ganancia_colombia_total ?? '0')}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{d.margen_colombia_porcentaje}%</p>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-bold">{formatCurrency(d.ganancia_colombia_neta_total ?? '0')}</td>
                      {order.mercado === 'VENEZUELA' && <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(d.costo_ajustado_venezuela ?? '0')}</td>}
                      {order.mercado === 'VENEZUELA' ? (
                        <td className="px-4 py-3 text-right text-gray-400 italic">{formatCurrency(d.pvp_colombia_total)}</td>
                      ) : (
                        <td className="px-4 py-3 text-right text-gray-400 italic">{formatCurrency(d.pvp_venezuela_total)}</td>
                      )}
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

      {/* Resumen de Totales */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Resumen</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Total Galones</p>
            <p className="text-xl font-bold">{totals.galones.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Total Kg</p>
            <p className="text-xl font-bold">{totals.kgs.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Costo (sin IVA)</p>
            <p className="text-xl font-bold">{formatCurrency(totals.costoSinIva)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Costo (con IVA)</p>
            <p className="text-xl font-bold">{formatCurrency(totals.costoConIva)}</p>
          </div>
          
          {order.mercado === 'COLOMBIA' ? (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
              <p className="text-blue-600 font-bold uppercase text-[10px] tracking-wider">Total PVP Colombia</p>
              <p className="text-xl font-black text-blue-700">{formatCurrency(totals.pvpCol)}</p>
            </div>
          ) : (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
              <p className="text-purple-600 font-bold uppercase text-[10px] tracking-wider">Total PVP Venezuela</p>
              <p className="text-xl font-black text-purple-700">{formatCurrency(totals.pvpVzla)}</p>
            </div>
          )}

          {!isJefeCompra && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic opacity-75">
              <p className="text-gray-400 font-medium text-[10px] uppercase">
                {order.mercado === 'COLOMBIA' ? 'Ref. PVP Venezuela' : 'Ref. PVP Colombia'}
              </p>
              <p className="text-lg font-bold text-gray-500">
                {formatCurrency(order.mercado === 'COLOMBIA' ? totals.pvpVzla : totals.pvpCol)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
