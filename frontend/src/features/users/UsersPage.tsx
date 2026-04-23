import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', nombre_completo: '', rol_id: 1 });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/usuarios')).data,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/usuarios/roles')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/usuarios', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setFormData({ email: '', password: '', nombre_completo: '', rol_id: 1 });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => 
      (await api.patch(`/usuarios/${id}`, { activo })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, rol_id: Number(formData.rol_id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Administra los accesos al sistema COLOXI</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando usuarios...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Rol</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.nombre_completo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
                      {u.role?.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: u.id, activo: !u.activo })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        u.activo ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        u.activo ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Botones adicionales pueden ir aquí */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Nuevo Usuario</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {createMutation.isError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {(createMutation.error as any)?.response?.data?.message || 'Error al crear usuario'}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo</label>
                <input required autoFocus type="text" value={formData.nombre_completo} onChange={e => setFormData(p => ({...p, nombre_completo: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
                <input required type="password" value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
                <select value={formData.rol_id} onChange={e => setFormData(p => ({...p, rol_id: e.target.value as any}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  {roles?.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50">
                  {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
