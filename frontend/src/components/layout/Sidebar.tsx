import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMemo } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = useMemo(() => {
    const role = user?.rol;
    const items = [
      { to: '/', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'GERENTE'] },
      { to: '/inventario', label: 'Inventario Interno', icon: '📊', roles: ['JEFE_COMPRA'] },
      { to: '/planificador', label: 'Planificador', icon: '📅', roles: ['JEFE_COMPRA'] },
      { 
        to: '/productos', 
        label: 'Maestro de Productos', 
        icon: '📦', 
        roles: ['ADMIN', 'GERENTE'] 
      },
      { to: '/catalogos', label: 'Catálogos', icon: '🏷️', roles: ['ADMIN', 'GERENTE'] },
      { to: '/ordenes', label: role === 'JEFE_COMPRA' ? 'Órdenes (Maestro)' : 'Órdenes de Compra', icon: '📋', roles: ['ADMIN', 'GERENTE', 'JEFE_COMPRA'] },
      { to: '/ordenes-revision', label: 'Órdenes en Revisión', icon: '⏳', roles: ['JEFE_COMPRA'] },
      { to: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['ADMIN'] },
      { to: '/configuracion', label: 'Configuración', icon: '⚙️', roles: ['ADMIN'] },
    ];
    return items.filter(item => item.roles.includes(role || ''));
  }, [user?.rol]);

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-wide">🎨 COLOXI</h1>
        <p className="text-xs text-gray-400 mt-1">Sistema de Gestión</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombre}</p>
            <p className="text-xs text-gray-400">{user?.rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
