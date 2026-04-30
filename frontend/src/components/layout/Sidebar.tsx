import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';

const NavIcons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Inventory: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  Plan: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Package: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
    </svg>
  ),
  Orders: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Review: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Logo: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
    </svg>
  ),
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: pendingData } = useQuery({
    queryKey: ['ordenes-pendientes-count'],
    queryFn: async () => {
      const res = await api.get('/ordenes/pendientes/count');
      return res.data;
    },
    enabled: user?.rol === 'ADMIN' || user?.rol === 'GERENTE',
    refetchInterval: 60000, // Cada minuto
  });
  const pendingCount = pendingData?.count || 0;

  const navItems = useMemo(() => {
    const role = user?.rol;
    const items = [
      { to: '/', label: 'Dashboard', icon: <NavIcons.Dashboard />, roles: ['ADMIN', 'GERENTE', 'JEFE_COMPRA'] },
      { 
        to: '/productos', 
        label: 'Maestro de Productos', 
        icon: <NavIcons.Package />, 
        roles: ['ADMIN', 'GERENTE'] 
      },
      { to: '/historial-precios', label: 'Auditoría Precios', icon: <NavIcons.History />, roles: ['ADMIN', 'GERENTE'] },
      { to: '/inventario', label: 'Inventario', icon: <NavIcons.Inventory />, roles: ['ADMIN', 'GERENTE', 'JEFE_COMPRA'] },
      { to: '/ordenes', label: 'Órdenes de Compra', icon: <NavIcons.Orders />, roles: ['ADMIN', 'GERENTE', 'JEFE_COMPRA'] },
      { to: '/catalogos', label: 'Colores', icon: <NavIcons.Palette />, roles: ['ADMIN'] },
      { to: '/usuarios', label: 'Usuarios', icon: <NavIcons.Users />, roles: ['ADMIN'] },
      { to: '/configuracion', label: 'Parámetros Globales', icon: <NavIcons.Settings />, roles: ['ADMIN'] },
    ];
    return items.filter(item => item.roles.includes(role || ''));
  }, [user?.rol]);

  return (
    <aside className="w-64 min-h-screen bg-[#0284c7] text-white flex flex-col shadow-2xl z-20">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <NavIcons.Logo />
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none text-white flex items-center">
            <span>COLO</span>
            <span className="relative">
              X
              <span className="absolute inset-0 text-[#fecf00] overflow-hidden" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)' }}>X</span>
            </span>
            <span className="relative ml-0.5">
              I
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-[#df0812] rounded-full shadow-sm shadow-red-900/20"></span>
            </span>
          </h1>
          <p className="text-[10px] text-[#fecf00] font-bold uppercase tracking-widest mt-1">Management v2</p>
        </div>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 group ${
                isActive
                  ? 'bg-white text-[#0284c7] shadow-lg shadow-black/10'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className={`transition-transform duration-300 group-hover:scale-110`}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.to === '/ordenes' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-auto animate-pulse shadow-sm">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile + Logout area */}
      <div className="p-4 bg-black/20 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 mb-4 p-2 bg-white/5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate tracking-tight text-white">{user?.nombre}</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">{user?.rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all uppercase tracking-widest"
        >
          <NavIcons.Logout />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
