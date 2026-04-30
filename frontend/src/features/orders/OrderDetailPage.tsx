import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderApi } from './orderApi';
import { productApi } from '../products/productApi';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatDate, getImageUrl } from '../../lib/utils';
import ProductRowCard, { ProductRowMetric, ProductRowTag } from '../../components/ProductRowCard';
import type { Product } from '../../types';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; accent: string; icon: string; step: number }> = {
  BORRADOR: { 
    label: 'Borrador', 
    bg: 'bg-slate-50', 
    text: 'text-slate-600', 
    border: 'border-slate-200',
    accent: 'bg-slate-400',
    icon: '📝',
    step: 1
  },
  ENVIADA: { 
    label: 'Pendiente de Aprobación', 
    icon: '⏳', 
    bg: 'bg-[#38bdf8]/10', 
    text: 'text-[#38bdf8]', 
    border: 'border-[#38bdf8]/20',
    accent: 'bg-[#38bdf8]',
    step: 2 
  },
  FINALIZADA: { 
    label: 'Orden Aprobada', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
    icon: '✅',
    step: 3
  },
  RECHAZADA: { 
    label: 'Orden Rechazada', 
    icon: '❌', 
    bg: 'bg-red-50', 
    text: 'text-red-600', 
    border: 'border-red-200',
    accent: 'bg-red-500',
    step: 2 
  },
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
      toast.success('Ítem agregado a la orden');
    },
    onError: () => toast.error('Error al agregar el ítem'),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => orderApi.removeItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Ítem eliminado de la orden');
    },
    onError: () => toast.error('Error al eliminar el ítem'),
  });

  const statusMutation = useMutation({
    mutationFn: (estado: string) => orderApi.updateStatus(id!, estado),
    onSuccess: (_, estado) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      const msgs: Record<string, string> = {
        ENVIADA: 'Orden enviada para aprobación',
        FINALIZADA: 'Orden aprobada exitosamente',
        RECHAZADA: 'Orden rechazada',
      };
      toast.success(msgs[estado] || 'Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const updateOrderMutation = useMutation({
    mutationFn: (obs: string) => orderApi.update(id!, { observaciones: obs }),
    onSuccess: () => {
      toast.success('Observaciones guardadas');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: () => toast.error('Error al guardar observaciones'),
  });

  // Handlers
  const handleSelectProduct = (prodId: number) => {
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

  const config = STATUS_CONFIG[order.estado] || STATUS_CONFIG.BORRADOR;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. STATUS STEPPER (Refined with soft tint) */}
      <div className="flex items-center justify-between bg-slate-50/80 backdrop-blur-sm px-8 py-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-8">
          {[
            { id: 1, label: 'Creación' },
            { id: 2, label: 'Aprobación' },
            { id: 3, label: 'Finalizado' }
          ].map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all border ${
                config.step >= step.id 
                  ? `${config.accent} text-white border-transparent shadow-md` 
                  : 'bg-white text-slate-300 border-slate-200'
              }`}>
                {config.step > step.id ? '✓' : step.id}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                config.step >= step.id ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
              {i < 2 && <div className="w-8 h-[1px] bg-slate-200 ml-2" />}
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
              {config.label}
           </span>
        </div>
      </div>

      {/* 2. LIGHT NORMAL HERO HEADER */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-black/[0.03] overflow-hidden relative group">
        {/* Subtle status strip at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${config.accent}`} />
        
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[1.25rem] ${config.bg} flex items-center justify-center text-3xl shadow-sm border ${config.border}`}>
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase font-mono">{order.codigo}</h1>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formatDate(order.created_at)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Autor de la Orden: <span className="text-gray-900 font-black underline decoration-gray-200 underline-offset-4">{order.creator?.nombre_completo ?? '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            {isBorrador && (isJefeCompra || user?.rol === 'ADMIN' || user?.rol === 'GERENTE') && (
              <button 
                onClick={() => statusMutation.mutate('ENVIADA')} 
                disabled={statusMutation.isPending}
                className="px-8 py-4 bg-[#0284c7] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#0269a1] transition-all flex items-center gap-3 shadow-xl shadow-blue-100"
              >
                {statusMutation.isPending ? '...' : <><span className="text-lg">📤</span> Solicitar Aprobación</>}
              </button>
            )}
            {order.estado === 'ENVIADA' && !isJefeCompra && (
              <>
                <button 
                  onClick={() => statusMutation.mutate('FINALIZADA')} 
                  disabled={statusMutation.isPending}
                  className="px-8 py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-100"
                >
                  {statusMutation.isPending ? '...' : <><span className="text-lg">✅</span> Aprobar Orden</>}
                </button>
                <button 
                  onClick={() => { if(window.confirm('¿Seguro quieres rechazar la orden?')) statusMutation.mutate('RECHAZADA') }} 
                  disabled={statusMutation.isPending}
                  className="px-8 py-4 bg-white text-rose-600 border border-rose-100 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 transition-all"
                >
                  {statusMutation.isPending ? '...' : 'Rechazar'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section: Observaciones (Integrated Light) */}
        <div className="px-10 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center gap-6">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-gray-300"></span>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Observaciones:</span>
           </div>
           <input 
             type="text"
             value={observaciones !== '' ? observaciones : (order.observaciones || '')} 
             onChange={(e) => setObservaciones(e.target.value)}
             placeholder={isBorrador ? "Añadir detalles..." : "Sin notas adicionales"}
             disabled={!isBorrador}
             className="flex-1 bg-transparent text-xs text-gray-600 outline-none border-none focus:ring-0 placeholder:text-gray-300 font-medium italic"
           />
           {isBorrador && (observaciones !== '' && observaciones !== order.observaciones) && (
             <button 
               onClick={() => updateOrderMutation.mutate(observaciones)}
               disabled={updateOrderMutation.isPending}
               className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all"
             >
               GUARDAR NOTA
             </button>
           )}
        </div>
      </div>

      {statusMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          {(statusMutation.error as any)?.response?.data?.message || 'Error al cambiar estado de la orden.'}
        </div>
      )}

      {/* 3. AGREGAR ÍTEMS (Solo Borrador) */}
      {isBorrador && (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/[0.03] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Agregar Producto a la Orden</h2>
              <p className="text-sm text-gray-400 font-medium">Configura las especificaciones del ítem antes de añadirlo.</p>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* A. Buscador de Producto */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">1. Localizar Producto</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Código, nombre o categoría..."
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all font-medium"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">🔍</span>
              </div>
              
              <div className="mt-4 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                  {productsList?.data?.map((p) => (
                    <button 
                      key={p.id} 
                      onClick={() => handleSelectProduct(p.id)}
                      className={`flex items-center gap-4 p-3 rounded-2xl text-left transition-all border-2 ${
                        selectedProduct?.id === p.id 
                          ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-4 ring-blue-500/5' 
                          : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-14 h-14 shrink-0 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm">
                        {p.imagen_principal ? (
                          <img src={getImageUrl(p.imagen_principal) || ''} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs text-gray-900 tracking-tight">{p.codigo}</p>
                        <p className="text-xs text-gray-500 truncate font-medium">{p.nombre}</p>
                        <div className="mt-1 flex items-center gap-2">
                           <span className="px-1.5 py-0.5 bg-gray-100 text-[8px] font-black uppercase text-gray-400 rounded-md tracking-wider">{p.presentacion}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {(!productsList?.data || productsList.data.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                      <span className="text-4xl mb-2 opacity-20">📭</span>
                      <p className="text-xs font-bold uppercase tracking-widest">Sin resultados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* B. Configuración (Dynamic Card) */}
            <div className="relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">2. Configurar Detalle</label>
              
              {!selectedProduct ? (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center border-4 border-dashed border-gray-50 rounded-[2.5rem] text-gray-300">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl animate-bounce">👈</div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Selecciona un producto</p>
                </div>
              ) : (
                <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/[0.02] animate-in slide-in-from-right-4 duration-500">
                  {addMutation.isError && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-3">
                      <span>⚠️</span> {(addMutation.error as any)?.response?.data?.message || 'Error al agregar ítem.'}
                    </div>
                  )}

                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 shrink-0 bg-gray-50 rounded-[1.5rem] overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center">
                      {(selectedProduct as any).imagen_principal ? (
                        <img src={getImageUrl((selectedProduct as any).imagen_principal) || ''} alt={selectedProduct.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl opacity-20">📦</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {selectedProduct.presentacion}
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 mt-2 leading-tight tracking-tighter">{selectedProduct.nombre}</h3>
                      <p className="text-xs font-mono font-bold text-gray-400 mt-1 uppercase">{selectedProduct.codigo}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Colors */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Selección de Color</label>
                        {colorId !== 0 && (
                          <span className="px-2 py-0.5 bg-gray-900 text-[8px] font-black text-white rounded uppercase">
                            {coloresDisponibles.find((c: any) => c.id === colorId)?.nombre}
                          </span>
                        )}
                      </div>
                      
                      {coloresDisponibles.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                          {coloresDisponibles.map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => setColorId(c.id)}
                              className={`w-11 h-11 rounded-full transition-all ring-offset-4 ring-2 ${
                                colorId === c.id ? 'ring-gray-900 scale-110 shadow-lg shadow-black/10' : 'ring-transparent hover:scale-110 opacity-70 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.codigo_hex }}
                              title={c.nombre}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-3">
                           <span className="text-xl">✨</span>
                           <p className="text-xs text-blue-700 font-bold italic uppercase tracking-wider">Unicolor / No requiere color</p>
                        </div>
                      )}
                    </div>

                    {/* Quantity + PVP */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Cantidad</label>
                        <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                          <button onClick={() => setCantidad(c => Math.max(1, (Number(c) || 1) - 1))} className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-white hover:shadow-sm rounded-xl transition font-black text-xl">-</button>
                          <input 
                            type="text" 
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value.replace(/[^0-9]/g, '') as any)}
                            className="flex-1 bg-transparent text-center font-black text-gray-900 focus:outline-none text-lg"
                          />
                          <button onClick={() => setCantidad(c => (Number(c) || 0) + 1)} className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-white hover:shadow-sm rounded-xl transition font-black text-xl">+</button>
                        </div>
                      </div>

                    </div>

                    <button
                      onClick={() => addMutation.mutate()}
                      disabled={(coloresDisponibles.length > 0 && !colorId) || addMutation.isPending}
                      className="w-full py-5 bg-blue-600 text-white text-sm font-black rounded-[1.5rem] hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                      {addMutation.isPending ? '...' : <><span className="text-xl">✨</span> Añadir a la Compra</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ITEMS TABLE (Refined with spacing) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.02] border border-gray-100 overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            Items de la Orden 
            <span className="px-3 py-1 bg-gray-100 text-gray-400 text-xs rounded-full">{order.detalles?.length ?? 0}</span>
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-blue-500" /> Vista Consolidada
          </div>
        </div>
          <div className="p-6 space-y-4">
            {order.detalles?.map((d) => {
              const tags: ProductRowTag[] = [
                { label: d.presentacion, colorClass: 'bg-gray-100 text-gray-600' }
              ];
              if (d.color_nombre) {
                tags.push({ label: `Color: ${d.color_nombre}`, colorClass: 'bg-blue-50 text-blue-700 border border-blue-100' });
              }

              const metrics: ProductRowMetric[] = [
                { label: 'Cantidad', value: d.cantidad, valueClass: 'text-xl font-black text-gray-900' },
                { label: 'Costo s/IVA', value: formatCurrency(d.costo_total_sin_iva) },
                { label: 'Costo c/IVA', value: formatCurrency(d.costo_total_con_iva) },
                { label: 'PVP COL', value: formatCurrency(d.pvp_colombia_total), valueClass: 'text-blue-700 font-bold' },
                { label: 'PVP VEN', value: formatCurrency(d.pvp_venezuela_total), valueClass: 'text-purple-700 font-bold' },
              ];

              if (!isJefeCompra) {
                metrics.push({
                  label: 'Gan. Neta COL',
                  value: formatCurrency(d.ganancia_colombia_neta_total ?? '0'),
                  subValue: `${d.margen_colombia_porcentaje}% M.B`,
                  valueClass: 'text-emerald-700 font-bold'
                });
                metrics.push({
                  label: 'Gan. VEN',
                  value: formatCurrency(d.ganancia_venezuela_total ?? '0'),
                  valueClass: 'text-fuchsia-700 font-bold'
                });
              }

              const actions = isBorrador ? (
                <button onClick={() => removeMutation.mutate(d.id)} className="px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Eliminar
                </button>
              ) : undefined;

              return (
                <ProductRowCard
                  key={d.id}
                  code={d.producto_codigo}
                  name={d.producto_nombre}
                  image={d.foto_url ? getImageUrl(d.foto_url) : null}
                  tags={tags}
                  metrics={metrics}
                  actions={actions}
                />
              );
            })}
            {(!order.detalles || order.detalles.length === 0) && (
              <div className="p-12 text-center text-gray-400 font-medium">No hay ítems en esta orden</div>
            )}
          </div>
      </div>

      {/* 5. RESUMEN DE IMPACTO FINANCIERO (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-gray-100 transition-all hover:scale-[1.02] duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl grayscale group-hover:grayscale-0 transition-all">📦</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Volumen Total</p>
            <div className="space-y-2">
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{totals.galones.toFixed(2)} <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Galones</span></p>
              <div className="flex items-center gap-2">
                 <span className="w-4 h-[2px] bg-blue-500 rounded-full" />
                 <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{totals.kgs.toFixed(2)} kg <span className="text-[10px] text-gray-300">Neto</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-gray-100 transition-all hover:scale-[1.02] duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl grayscale group-hover:grayscale-0 transition-all">💰</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Inversión Estimada</p>
            <div className="space-y-2">
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{formatCurrency(totals.costoConIva)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Iva incl. / {formatCurrency(totals.costoSinIva)} base</p>
            </div>
          </div>

          {!isJefeCompra && (
            <>
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 text-white relative overflow-hidden group transition-all hover:scale-[1.02] duration-500">
                <div className="absolute -right-6 -top-6 text-[10rem] opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">📉</div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Beneficio Proyectado COL</p>
                <p className="text-4xl font-black tracking-tighter text-emerald-400">
                  {formatCurrency((order.detalles || []).reduce((sum, d) => sum + parseFloat(String(d.ganancia_colombia_neta_total || 0)), 0))}
                </p>
                <div className="mt-4 flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 tracking-widest">ROI EST.</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group transition-all hover:scale-[1.02] duration-500">
                <div className="absolute -right-6 -top-6 text-[10rem] opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none">🇻🇪</div>
                <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-4">Beneficio Proyectado VZLA</p>
                <p className="text-4xl font-black tracking-tighter">
                  {formatCurrency((order.detalles || []).reduce((sum, d) => sum + parseFloat(String(d.ganancia_venezuela_total || 0)), 0))}
                </p>
                <div className="mt-4 flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-lg border border-white/20 tracking-widest">FACTOR ACT.</span>
                   <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Basado en exportación</p>
                </div>
              </div>
            </>
          )}

          {isJefeCompra && (
            <>
               <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50 transition-all hover:scale-[1.02] duration-500">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Valor Mercado (PVP COL)</p>
                  <p className="text-3xl font-black text-blue-700 tracking-tighter">{formatCurrency(totals.pvpCol)}</p>
               </div>
               <div className="bg-violet-50/50 p-8 rounded-[2.5rem] border border-violet-100/50 transition-all hover:scale-[1.02] duration-500">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-4">Valor Mercado (PVP VZLA)</p>
                  <p className="text-3xl font-black text-violet-700 tracking-tighter">{formatCurrency(totals.pvpVzla)}</p>
               </div>
            </>
          )}
      </div>
    </div>
  );
}
