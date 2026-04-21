import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../inventory/inventoryApi';
import { orderApi } from '../orders/orderApi';
import { formatNumber } from '../../lib/utils';

interface PlanState {
  demanda: number;
  sugerida: number;
  aComprar: number;
}

export default function PlanificadorComprasPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Storage for planner state across pagination
  const [plan, setPlan] = useState<Record<string, PlanState>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-planner', page, search],
    queryFn: () => inventoryApi.getAll({
      page,
      limit: 15,
      search: search || undefined,
    }),
  });

  const handleDemandaChange = (itemId: string, stock: number, minStock: number, newVal: string) => {
    const demanda = Math.max(0, parseInt(newVal) || 0);
    const deficit = stock - demanda;
    const sugerida = Math.max(0, minStock - deficit);

    setPlan(prev => ({
      ...prev,
      [itemId]: {
        demanda,
        sugerida,
        aComprar: sugerida,
      }
    }));
  };

  const handleCantidadChange = (itemId: string, newVal: string) => {
    const aComprar = Math.max(0, parseInt(newVal) || 0);
    setPlan(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { demanda: 0, sugerida: 0 }),
        aComprar,
      }
    }));
  };

  const handleClear = () => {
    setPlan({});
  };

  const selectedCount = Object.values(plan).filter(p => p.aComprar > 0).length;

  const handleGenerateDraft = async () => {
    // We need product IDs from the inventory items
    const itemsWithProducts = data?.data || [];
    const productsToBuy = Object.entries(plan)
      .filter(([, state]) => state.aComprar > 0)
      .map(([itemId, state]) => {
        const invItem = itemsWithProducts.find((i: any) => i.id === itemId);
        return { producto_id: invItem?.producto?.id || invItem?.producto_id, qty: state.aComprar };
      })
      .filter(item => item.producto_id);

    if (productsToBuy.length === 0) return;

    try {
      setIsGenerating(true);
      const order = await orderApi.create({ mercado: 'COLOMBIA', observaciones: 'Generado desde Planificador' });

      for (const item of productsToBuy) {
        try {
          await orderApi.addItem(order.id, {
            producto_id: item.producto_id,
            cantidad: item.qty,
          });
        } catch (e) {
          console.error(`Error adding item ${item.producto_id}`, e);
        }
      }

      navigate(`/ordenes/${order.id}`);
    } catch (error) {
      console.error('Error creating draft order', error);
      alert('Error al generar el borrador');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planificador de Compras</h1>
          <p className="text-gray-500 mt-1">Simula escenarios de demanda y genera compras sugeridas</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
          >
            Limpiar todo
          </button>
          <button
            onClick={handleGenerateDraft}
            disabled={selectedCount === 0 || isGenerating}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? 'Generando...' : `Generar O.C. Borrador (${selectedCount})`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando inventario...</div>
        ) : !data?.data?.length ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-600">No hay productos en el inventario interno</p>
            <p className="text-sm mt-1">Agrega productos primero desde las Órdenes</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left w-12"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-blue-600 uppercase bg-blue-50/50">Demanda P.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock Min.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Déf/Sup</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sugerida</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-emerald-600 uppercase bg-emerald-50/50 w-32">Comprar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((item: any) => {
                  const prod = item.producto;
                  const stock = Number(item.stock_actual) || 0;
                  const minStock = Number(item.stock_minimo) || 0;

                  const pState = plan[item.id] || { demanda: 0, sugerida: 0, aComprar: 0 };
                  const deficitNum = stock - pState.demanda;

                  let rowClass = "hover:bg-gray-50 transition-colors";
                  if (deficitNum < 0) {
                    rowClass = "bg-red-50/60 hover:bg-red-100/50 transition-colors";
                  } else if (deficitNum < minStock) {
                    rowClass = "bg-yellow-50/60 hover:bg-yellow-100/50 transition-colors";
                  }

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shadow-sm flex items-center justify-center border border-gray-100">
                          {prod?.imagen_principal ? (
                            <img src={prod.imagen_principal} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs">📦</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-medium text-gray-500">{prod?.codigo}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1" title={prod?.nombre}>{prod?.nombre}</p>
                        <p className="text-xs text-gray-500">{prod?.presentacion}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{formatNumber(stock, 0)}</td>
                      <td className="px-4 py-3 text-center bg-blue-50/20">
                        <input
                          type="number"
                          min="0"
                          value={pState.demanda || ''}
                          onChange={(e) => handleDemandaChange(item.id, stock, minStock, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-center border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-inner font-mono text-blue-900"
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">{formatNumber(minStock, 0)}</td>
                      <td className="px-4 py-3 text-center text-sm font-mono font-medium">
                        <span className={deficitNum < 0 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {deficitNum > 0 ? '+' : ''}{formatNumber(deficitNum, 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-400">
                        {formatNumber(pState.sugerida, 0)}
                      </td>
                      <td className="px-4 py-3 text-center bg-emerald-50/20">
                        <input
                          type="number"
                          min="0"
                          value={pState.aComprar || ''}
                          onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-center border border-emerald-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner font-mono font-bold text-emerald-700 disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
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
