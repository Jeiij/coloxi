import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../orders/orderApi';
import type { Product, Color } from '../../../types';

interface AddToOrderModalProps {
  product: Product;
  onClose: () => void;
}

export default function AddToOrderModal({ product, onClose }: AddToOrderModalProps) {
  const navigate = useNavigate();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('NEW_ORDER');
  const [mercado, setMercado] = useState<string>('COLOMBIA');
  const [colorId, setColorId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);

  // Obtener órdenes en borrador
  const { data: draftOrdersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ['draft-orders'],
    queryFn: () => orderApi.getAll({ estado: 'BORRADOR', limit: 10 }),
  });

  const draftOrders = draftOrdersResponse?.data || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      let activeOrderId = selectedOrderId;
      
      // 1. Crear la orden si seleccionó "Crear nueva"
      if (activeOrderId === 'NEW_ORDER') {
        const newOrder = await orderApi.create({ mercado });
        activeOrderId = newOrder.id;
      }

      // 2. Agregar ítem a la orden
      if (!colorId) throw new Error("Debe seleccionar un color");
      
      await orderApi.addItem(activeOrderId, {
        producto_id: product.id,
        color_id: Number(colorId),
        cantidad: Number(cantidad)
      });

      return activeOrderId; // Devolvemos el ID de la orden destino
    },
    onSuccess: (orderId) => {
      onClose();
      navigate(`/ordenes/${orderId}`);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Error al agregar a la orden');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorId) return alert('Debe seleccionar un color');
    addMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Agregar a Orden</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✖</button>
        </div>

        <div className="p-5">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-blue-600 font-mono mb-1">{product.codigo}</h3>
            <p className="font-medium text-gray-900">{product.nombre}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Destino de la orden */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Orden Destino</label>
              {loadingOrders ? (
                <div className="text-xs text-gray-400">Buscando borradores...</div>
              ) : (
                <select 
                  value={selectedOrderId} 
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {draftOrders.length > 0 && <optgroup label="Borradores Actuales">
                    {draftOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.codigo || o.id.split('-')[0]} - {o.mercado}
                      </option>
                    ))}
                  </optgroup>}
                  <optgroup label="Nuevas">
                    <option value="NEW_ORDER">+ Crear Nueva Orden</option>
                  </optgroup>
                </select>
              )}
            </div>

            {/* Mercado (Solo si es orden nueva) */}
            {selectedOrderId === 'NEW_ORDER' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mercado (Nueva Orden)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="COLOMBIA" checked={mercado === 'COLOMBIA'} onChange={e => setMercado(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Colombia
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="VENEZUELA" checked={mercado === 'VENEZUELA'} onChange={e => setMercado(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Venezuela
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color *</label>
                <select 
                  required
                  value={colorId} 
                  onChange={(e) => setColorId(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {(product.colores || []).map((col: Color) => (
                    <option key={col.id} value={col.id}>{col.nombre}</option>
                  ))}
                </select>
                {(!product.colores || product.colores.length === 0) && (
                  <p className="text-[10px] text-red-500 mt-1">El producto no tiene colores</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad *</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={cantidad} 
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={addMutation.isPending || (!colorId && (product.colores || []).length > 0) || (product.colores || []).length === 0} 
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {addMutation.isPending ? 'Agregando...' : 'Agregar e Ir a la Orden'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
