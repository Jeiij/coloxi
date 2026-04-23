import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { orderApi } from './orderApi';

export default function NewOrderPage() {
  const [observaciones, setObservaciones] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => orderApi.create({ mercado: 'AMBOS', observaciones: observaciones || undefined }),
    onSuccess: (order) => navigate(`/ordenes/${order.id}`),
  });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Orden de Compra</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones (opcional)</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            placeholder="Notas sobre esta orden..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {mutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Error al crear la orden. Inténtalo de nuevo.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
        >
          {mutation.isPending ? 'Creando...' : 'Crear Orden de Compra'}
        </button>
      </div>
    </div>
  );
}
