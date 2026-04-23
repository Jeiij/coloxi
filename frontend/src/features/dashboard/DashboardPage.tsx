import { useQuery } from '@tanstack/react-query';
import { productApi } from '../products/productApi';
import { orderApi } from '../orders/orderApi';
import { useAuthStore } from '../../stores/authStore';

function KpiCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: products } = useQuery({ queryKey: ['products-kpi'], queryFn: () => productApi.getAll({ limit: 1 }) });
  const { data: orders } = useQuery({ queryKey: ['orders-kpi'], queryFn: () => orderApi.getAll({ limit: 1 }) });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.nombre} 👋</h1>
        <p className="text-gray-500 mt-1">Resumen del sistema COLOXI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Productos" value={products?.meta?.total ?? '...'} icon="📦" color="bg-blue-50" />
        <KpiCard title="Total Órdenes" value={orders?.meta?.total ?? '...'} icon="📋" color="bg-purple-50" />
        <KpiCard title="Tu Rol" value={user?.rol ?? '—'} icon="👤" color="bg-green-50" />
        <KpiCard title="Estado" value="Operativo" icon="✅" color="bg-yellow-50" />
      </div>

      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/productos" className="block p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
            <span className="text-lg">📦</span>
            <p className="font-medium mt-2">Ver Productos</p>
            <p className="text-xs text-gray-500">Consultar inventario y precios</p>
          </a>
          <a href="/ordenes" className="block p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
            <span className="text-lg">📋</span>
            <p className="font-medium mt-2">Ver Órdenes</p>
            <p className="text-xs text-gray-500">Gestionar órdenes de compra</p>
          </a>
          <a href="/ordenes/nueva" className="block p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
            <span className="text-lg">➕</span>
            <p className="font-medium mt-2">Nueva Orden</p>
            <p className="text-xs text-gray-500">Crear una orden de compra</p>
          </a>
        </div>
      </div>
    </div>
  );
}
