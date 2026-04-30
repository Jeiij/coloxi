import { useQuery } from '@tanstack/react-query';
import { productApi } from '../products/productApi';
import { orderApi } from '../orders/orderApi';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import { useNavigate, Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils';
import { useState, useEffect } from 'react';
import OrderRowCard from '../../components/OrderRowCard';

const estadoBadge: Record<string, string> = {
  BORRADOR: 'bg-yellow-100 text-yellow-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
};

const estadoLabelMap: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Pendiente Aprobación',
  FINALIZADA: 'Finalizada',
};

// Iconos SVG minimalistas
const Icons = {
  Products: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Orders: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Success: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Agotado: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
};

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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    setCurrentDate(`${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`);
  }, []);

  const { data: products } = useQuery({ queryKey: ['products-kpi'], queryFn: () => productApi.getAll({ limit: 1 }) });
  const { data: orders } = useQuery({ queryKey: ['orders-kpi'], queryFn: () => orderApi.getAll({ limit: 5 }) });
  const { data: invStats } = useQuery({ 
    queryKey: ['inv-stats'], 
    queryFn: async () => {
      const res = await api.get('/inventario/stats');
      return res.data;
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Banner (Reduced Size) */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 text-slate-800 shadow-xl shadow-blue-900/[0.03] border border-slate-100 flex items-center group">
        {/* Thick Executive Accent Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7] rounded-l-full" />
        
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-lg border border-slate-100">
               {currentDate}
             </div>
             <div className="w-2 h-2 bg-[#0284c7] rounded-full animate-pulse" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tighter text-slate-900">
            Bienvenido, <span className="text-[#0284c7]">{user?.nombre.split(' ')[0]}</span>
          </h1>
          
          <p className="text-slate-500 max-w-md text-base leading-relaxed font-medium">
            Estado de Operaciones: Tienes <span className="text-slate-900 font-black border-b-2 border-[#0284c7]/30">{(invStats?.stock_bajo ?? 0) + (invStats?.agotados ?? 0)} alertas</span> críticas en tu inventario.
          </p>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none flex items-center justify-end pr-12">
           <svg className="w-32 h-32 text-slate-100 transform rotate-12" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
           </svg>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        <KpiCard 
          title="Maestro Productos" 
          value={products?.meta?.total ?? '...'} 
          icon={<Icons.Products />} 
          color="bg-blue-50 text-blue-600" 
          subValue="Catálogo Vigente" 
        />
        <KpiCard 
          title="Inventario" 
          value={invStats?.ok ?? 0} 
          icon={<Icons.Success />} 
          color="bg-emerald-50 text-emerald-600" 
          subValue="Stock Óptimo" 
        />
        <KpiCard 
          title="Pendientes" 
          value={orders?.data?.filter((o: any) => o.estado === 'ENVIADA').length ?? 0} 
          icon={<Icons.Orders />} 
          color="bg-purple-50 text-purple-600" 
          subValue="Órdenes por revisar" 
        />
        <KpiCard 
          title="Stock Bajo" 
          value={invStats?.stock_bajo ?? 0} 
          icon={<Icons.Alert />} 
          color="bg-[#fbd200]/10 text-[#fbd200]" 
          subValue="Reponer pronto" 
        />
        <KpiCard 
          title="Agotados" 
          value={invStats?.agotados ?? 0} 
          icon={<Icons.Agotado />} 
          color="bg-[#e60411]/10 text-[#e60411]" 
          subValue="Atención Urgente" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Últimas Órdenes</h2>
            <Link to="/ordenes" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Ver todas <span>→</span>
            </Link>
          </div>
          
          <div className="space-y-3">
            {orders?.data?.filter((o: any) => o.estado !== 'BORRADOR').map((o: any) => {
              const actions = (
                <button 
                  onClick={() => navigate(`/ordenes/${o.id}`)} 
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition shadow-sm text-center whitespace-nowrap"
                >
                  Ver detalle →
                </button>
              );

              return (
                <OrderRowCard
                  key={o.id}
                  codigo={o.codigo}
                  fecha={formatDate(o.fecha)}
                  creadoPor={o.creator?.nombre_completo}
                  totalItems={o._count?.detalles ?? 0}
                  estadoBadgeClass={estadoBadge[o.estado] || 'bg-gray-100 text-gray-700'}
                  estadoLabel={estadoLabelMap[o.estado] || o.estado}
                  actions={actions}
                  onClick={() => navigate(`/ordenes/${o.id}`)}
                />
              );
            })}
            {(!orders?.data || orders.data.length === 0) && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 font-medium italic border border-gray-100 shadow-sm">
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight px-2">Acciones Rápidas</h2>
          <div className="space-y-4">
            <Link to="/ordenes" className="group flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Icons.Plus />
              </div>
              <div>
                <p className="font-black text-gray-900 tracking-tight">Nueva Orden</p>
                <p className="text-xs text-gray-500 font-medium">Crear pedido a proveedor</p>
              </div>
            </Link>

            <Link to="/productos" className="group flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Icons.Products />
              </div>
              <div>
                <p className="font-black text-gray-900 tracking-tight">Maestro Productos</p>
                <p className="text-xs text-gray-500 font-medium">Gestión de catálogo y precios</p>
              </div>
            </Link>

            <Link to="/configuracion" className="group flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Icons.Settings />
              </div>
              <div>
                <p className="font-black text-gray-900 tracking-tight">Parámetros Globales</p>
                <p className="text-xs text-gray-500 font-medium">Tasas, Márgenes y Configuración</p>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
