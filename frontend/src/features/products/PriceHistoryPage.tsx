import { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { productApi } from './productApi';
import api from '../../lib/axios';
import { formatDate, formatCurrency } from '../../lib/utils';

export default function PriceHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productoIdParam = searchParams.get('productoId');
  
  const [search, setSearch] = useState('');
  const [mes, setMes] = useState<string>('');
  const [usuarioId, setUsuarioId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    productoIdParam ? parseInt(productoIdParam) : null
  );

  // Sync state with URL params
  useEffect(() => {
    if (productoIdParam) {
      setSelectedProductId(parseInt(productoIdParam));
    }
  }, [productoIdParam]);

  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id);
    setSearchParams({ productoId: id.toString() });
  };

  // Cargar lista de productos para el panel izquierdo
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-all-history', search],
    queryFn: () => productApi.getAll({ limit: 100, search }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/usuarios')).data,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingHistory
  } = useInfiniteQuery({
    queryKey: ['product-price-history', selectedProductId, mes, usuarioId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!selectedProductId) return { data: [], meta: { page: 1, totalPages: 1 } };
      
      const params: any = { 
        page: pageParam, 
        limit: 15,
        productoId: selectedProductId // We'll need to update the backend to support this filter in the global endpoint or use a specific one
      };
      if (mes) params.mes = Number(mes);
      if (usuarioId) params.usuarioId = usuarioId;
      
      // We can use the global history endpoint but passing the productoId
      return productApi.getGlobalHistory(params);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!selectedProductId,
  });

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const historyRecords = data?.pages.flatMap((page) => page.data) || [];
  const selectedProduct = productsData?.data?.find(p => p.id === selectedProductId);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Panel Izquierdo: Lista de Productos */}
      <div className="w-1/3 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Auditoría de Precios</h2>
          <p className="text-sm text-gray-500 mt-1">Selecciona un producto para ver su historial.</p>
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar producto o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingProducts ? (
            <div className="text-center p-8 text-sm text-gray-400 font-medium">Cargando productos...</div>
          ) : (
            productsData?.data?.map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleSelectProduct(prod.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border ${
                  selectedProductId === prod.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500/20' 
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    selectedProductId === prod.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {prod.codigo || 'S/N'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.presentacion}</span>
                </div>
                <h3 className={`font-bold leading-tight ${selectedProductId === prod.id ? 'text-blue-900' : 'text-gray-900'}`}>
                  {prod.nombre}
                </h3>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Panel Derecho: Línea de Tiempo */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {!selectedProductId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Historial de Precios</h3>
            <p className="max-w-xs text-sm leading-relaxed">Selecciona un producto del panel izquierdo para ver su evolución de costos y PVPs.</p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-end">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {selectedProduct?.codigo}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedProduct?.nombre}</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Auditoría de cambios financieros</p>
              </div>

              <div className="flex gap-3">
                <div className="w-32">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    <option value="">Todos</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Usuario</label>
                  <select
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    <option value="">Todos</option>
                    {users?.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.nombre_completo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
              {isLoadingHistory ? (
                <div className="text-center p-8 text-sm text-gray-400 font-medium">Cargando historial...</div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center p-8 text-sm text-gray-400 font-medium">No hay registros con los filtros seleccionados.</div>
              ) : (
                <div className="relative border-l-2 border-gray-200 ml-4 space-y-12 pb-10">
                  {historyRecords.map((record: any, index: number) => {
                    const isNewest = index === 0 && !mes && !usuarioId;
                    return (
                      <div key={record.id} className="relative pl-8">
                        <div className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isNewest ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          {isNewest && <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />}
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{formatDate(record.created_at)}</p>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">👤</span>
                                {record.user?.nombre_completo || 'Sistema / Inicial'}
                              </p>
                            </div>
                            {isNewest && (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                Valor Actual
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Costo Base</p>
                              <p className="text-lg font-black text-gray-900 font-mono">{formatCurrency(record.costo_unitario_sin_iva)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PVP Colombia</p>
                              <p className="text-lg font-black text-blue-600 font-mono">{formatCurrency(record.pvp_colombia)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PVP Venezuela</p>
                              <p className="text-lg font-black text-purple-600 font-mono">{formatCurrency(record.pvp_venezuela)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={loadMoreRef} className="h-4">
                    {isFetchingNextPage && <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cargando...</p>}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
