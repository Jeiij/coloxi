import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductListPage from './features/products/ProductListPage';
import ProductFormPage from './features/products/ProductFormPage';
import OrderListPage from './features/orders/OrderListPage';
import NewOrderPage from './features/orders/NewOrderPage';
import OrderDetailPage from './features/orders/OrderDetailPage';
import OrdenesRevisionPage from './features/orders/OrdenesRevisionPage';
import UsersPage from './features/users/UsersPage';
import SettingsPage from './features/settings/SettingsPage';
import CatalogsPage from './features/catalogs/CatalogsPage';
import DashboardJefeCompra from './features/dashboard/DashboardJefeCompra';
import PlanificadorComprasPage from './features/dashboard/PlanificadorComprasPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {/* Rutas compartidas */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/productos" element={<ProductListPage />} />
            <Route path="/inventario" element={<DashboardJefeCompra />} />
            <Route path="/planificador" element={<PlanificadorComprasPage />} />
            <Route path="/ordenes" element={<OrderListPage />} />
            <Route path="/ordenes-revision" element={<OrdenesRevisionPage />} />
            <Route path="/ordenes/nueva" element={<NewOrderPage />} />
            <Route path="/ordenes/:id" element={<OrderDetailPage />} />

            {/* Rutas ADMIN / GERENTE */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'GERENTE']} />}>
              <Route path="/productos/nuevo" element={<ProductFormPage />} />
              <Route path="/productos/:id/editar" element={<ProductFormPage />} />
              <Route path="/catalogos" element={<CatalogsPage />} />
            </Route>

            {/* Rutas ADMIN exclusivo */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '1rem', fontSize: '14px', fontWeight: 600 },
          success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' }, duration: 5000 },
        }}
      />
    </QueryClientProvider>
  );
}
