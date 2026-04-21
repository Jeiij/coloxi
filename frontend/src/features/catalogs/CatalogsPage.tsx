import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';

const TABS = [
  { id: 'categorias', label: 'Categorías', endpoint: '/catalogos/categorias' },
  { id: 'lineas', label: 'Líneas', endpoint: '/catalogos/lineas' },
  { id: 'marcas', label: 'Marcas', endpoint: '/catalogos/marcas' },
  { id: 'colores', label: 'Colores', endpoint: '/catalogos/colores' },
];

export default function CatalogsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ nombre: '', codigo_hex: '#ffffff' });

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', activeTab.id],
    queryFn: async () => (await api.get(activeTab.endpoint)).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        return (await api.patch(`${activeTab.endpoint}/${editingItem.id}`, payload)).data;
      }
      return (await api.post(activeTab.endpoint, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', activeTab.id] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`${activeTab.endpoint}/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog', activeTab.id] }),
  });

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData({ 
      nombre: item ? item.nombre : '',
      codigo_hex: item && item.codigo_hex ? item.codigo_hex : '#ffffff' 
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ nombre: '', codigo_hex: '#ffffff' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(
      activeTab.id === 'colores' 
        ? { nombre: formData.nombre, codigo_hex: formData.codigo_hex }
        : { nombre: formData.nombre }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogos del Sistema</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las listas desplegables y opciones</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          + Nuevo {activeTab.label.slice(0, -1)}
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-900/5 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab.id === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-900/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Cargando {activeTab.label.toLowerCase()}...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Nombre</th>
                {activeTab.id === 'colores' && <th className="px-6 py-4">Color</th>}
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.map((item: any) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{item.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                  {activeTab.id === 'colores' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: item.codigo_hex }}></span>
                        <span className="text-xs font-mono text-gray-500">{item.codigo_hex}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openModal(item)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Editar
                    </button>
                    <button onClick={() => { if(confirm('¿Seguro que desea eliminar?')) deleteMutation.mutate(item.id) }} className="text-sm font-medium text-red-600 hover:text-red-800">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay registros en {activeTab.label.toLowerCase()}.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{editingItem ? 'Editar' : 'Nuevo'} {activeTab.label.slice(0, -1)}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input autoFocus required type="text" value={formData.nombre} onChange={e => setFormData(p => ({...p, nombre: e.target.value}))} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              {activeTab.id === 'colores' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Color (Hex) *</label>
                  <div className="flex items-center gap-3">
                    <input required type="color" value={formData.codigo_hex} onChange={e => setFormData(p => ({...p, codigo_hex: e.target.value}))} className="h-10 w-16 p-1 rounded cursor-pointer border border-gray-200" />
                    <input required type="text" value={formData.codigo_hex} onChange={e => setFormData(p => ({...p, codigo_hex: e.target.value}))} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition">Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
