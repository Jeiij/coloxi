import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../orders/orderApi';
import { productApi } from '../productApi';
import { formatCurrency, getImageUrl } from '../../../lib/utils';
import type { Color } from '../../../types';

interface ProductSlideOverProps {
  productId: number | null;
  onClose: () => void;
}

export default function ProductSlideOver({ productId, onClose }: ProductSlideOverProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // States for order building
  const [selectedOrderId, setSelectedOrderId] = useState<string>('NEW_ORDER');
  const [mercado, setMercado] = useState<string>('COLOMBIA');
  const [colorId, setColorId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);

  useEffect(() => {
    if (productId) {
      setIsOpen(true);
      setCantidad(1);
      setColorId('');
    } else {
      setIsOpen(false);
    }
  }, [productId]);

  // Handle closing animation
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for transition
  };

  // Fetch full product details
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId!),
    enabled: !!productId,
  });

  // Fetch draft orders
  const { data: draftOrdersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ['draft-orders'],
    queryFn: () => orderApi.getAll({ estado: 'BORRADOR', limit: 10 }),
    enabled: !!productId,
  });

  const draftOrders = draftOrdersResponse?.data || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      let activeOrderId = selectedOrderId;
      if (activeOrderId === 'NEW_ORDER') {
        const newOrder = await orderApi.create({ mercado });
        activeOrderId = newOrder.id;
      }

      if (!product) throw new Error("Producto no cargado");
      if ((product.colores?.length || 0) > 0 && !colorId) {
        throw new Error("Debe seleccionar un color");
      }
      
      await orderApi.addItem(activeOrderId, {
        producto_id: product.id,
        color_id: colorId ? Number(colorId) : undefined, 
        cantidad: Number(cantidad)
      });

      return activeOrderId;
    },
    onSuccess: (orderId) => {
      handleClose();
      navigate(`/ordenes/${orderId}`);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al agregar a la orden');
    }
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((product?.colores?.length || 0) > 0 && !colorId) return alert('Debe seleccionar un color');
    addMutation.mutate();
  };

  if (!productId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={handleClose}
      />

      {/* Slide-over panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {loadingProduct || !product ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400 font-medium">Cargando detalles...</div>
          </div>
        ) : (
          <>
            {/* Header / Product Image Container */}
            <div className="relative bg-gray-100 h-64 shrink-0 overflow-hidden group">
              {product.imagenes && product.imagenes[0] ? (
                <img 
                  src={getImageUrl(product.imagenes[0].url_imagen) || ''} 
                  alt={product.nombre} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
              
              <button 
                onClick={handleClose} 
                className="absolute top-4 right-4 w-10 h-10 bg-white/50 backdrop-blur text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition"
              >
                ✕
              </button>
              
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-12 pb-4 px-6">
                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded opacity-90 mb-2 tracking-wide">
                  {product.categoria?.nombre || 'General'}
                </span>
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">{product.nombre}</h2>
                <p className="text-blue-100 font-mono text-sm">{product.codigo}</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Costo Unitario Configurado</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(product.costo_unitario_sin_iva)}</p>
                  </div>
                </div>

                <form id="add-to-order-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Colors Swatches */}
                  {product.colores && product.colores.length > 0 && (
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label className="block text-sm font-bold text-gray-900">1. Selecciona el Color</label>
                        {colorId && (
                          <span className="text-xs font-medium text-gray-500">
                            {product.colores.find((c: Color) => c.id === colorId)?.nombre}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {product.colores.map((cp: Color) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => setColorId(cp.id)}
                            className={`w-10 h-10 rounded-full transition-all focus:outline-none ring-offset-2 ${
                              colorId === cp.id ? 'ring-2 ring-blue-600 scale-110 shadow-md' : 'ring-1 ring-gray-200 hover:scale-105 hover:shadow-sm'
                            }`}
                            style={{ backgroundColor: cp.codigo_hex || '#ccc' }}
                            title={cp.nombre}
                          />
                        ))}
                      </div>
                      {!colorId && <p className="text-xs text-red-500 mt-2 font-medium">Requerido *</p>}
                    </div>
                  )}

                  <hr className="border-gray-100" />

                  {/* Order Dest. */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">2. Orden Destino</label>
                    {loadingOrders ? (
                      <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
                    ) : (
                      <div className="space-y-3">
                        {draftOrders.map(o => (
                          <label key={o.id} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${selectedOrderId === o.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" value={o.id} checked={selectedOrderId === o.id} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">{o.codigo || o.id.split('-')[0]}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">Borrador</span>
                          </label>
                        ))}
                        
                        <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${selectedOrderId === 'NEW_ORDER' ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" value="NEW_ORDER" checked={selectedOrderId === 'NEW_ORDER'} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">Crear una Nueva Orden</span>
                          </div>
                          <span className="text-xl">✨</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Market Selection if New Order */}
                  <div className={`overflow-hidden transition-all duration-300 ${selectedOrderId === 'NEW_ORDER' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex gap-4">
                      <label className="flex-1 flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="radio" value="COLOMBIA" checked={mercado === 'COLOMBIA'} onChange={e => setMercado(e.target.value)} className="w-4 h-4 text-blue-600" />
                        Colombia
                      </label>
                      <label className="flex-1 flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="radio" value="VENEZUELA" checked={mercado === 'VENEZUELA'} onChange={e => setMercado(e.target.value)} className="w-4 h-4 text-blue-600" />
                        Venezuela
                      </label>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Quantity */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">3. Cantidad ({product.presentacion})</label>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button type="button" onClick={() => setCantidad(c => Math.max(1, (Number(c) || 1) - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition font-bold text-lg">-</button>
                        <input 
                          type="text" 
                          value={cantidad}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCantidad(val as any);
                          }}
                          onBlur={() => { if(!cantidad || Number(cantidad) < 1) setCantidad(1); }}
                          className="w-14 h-10 text-center font-bold text-gray-900 border-x border-gray-200 focus:outline-none appearance-none"
                        />
                        <button type="button" onClick={() => setCantidad(c => (Number(c) || 0) + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition font-bold text-lg">+</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-5 bg-white border-t border-gray-100 shrink-0">
              <button 
                form="add-to-order-form"
                type="submit" 
                disabled={addMutation.isPending || ((product.colores?.length || 0) > 0 && !colorId)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl transition shadow-lg shadow-black/10 disabled:opacity-50 group font-bold text-lg"
              >
                <span>{addMutation.isPending ? 'Procesando...' : 'Agregar al Borrador'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
