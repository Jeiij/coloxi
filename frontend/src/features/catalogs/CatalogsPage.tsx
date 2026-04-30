import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

export default function CatalogsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const endpoint = '/catalogos/colores';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ nombre: '', codigo_hex: '#ffffff' });

  const { data: colors, isLoading } = useQuery({
    queryKey: ['catalog', 'colores'],
    queryFn: async () => (await api.get(endpoint)).data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        return (await api.patch(`${endpoint}/${editingItem.id}`, payload)).data;
      }
      return (await api.post(endpoint, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'colores'] });
      toast.success(editingItem ? 'Color actualizado exitosamente' : 'Color creado exitosamente');
      closeModal();
    },
    onError: () => toast.error('Error al guardar el color'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`${endpoint}/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'colores'] });
      toast.success('Color eliminado permanentemente');
    },
    onError: (err: any) => {
      console.error('Error deleting color:', err);
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      toast.error(`No se pudo eliminar: ${msg}`);
    },
  });

  // Filtrado local por búsqueda
  const filteredColors = colors?.filter((it: any) => 
    it.nombre.toLowerCase().includes(search.toLowerCase()) || 
    it.codigo_hex?.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
    saveMutation.mutate({ nombre: formData.nombre, codigo_hex: formData.codigo_hex });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-600 w-1.5 h-6 rounded-full"></span>
            Gamas de Colores
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los colores disponibles para los productos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-100 flex items-center gap-2"
        >
          <span>+</span> Nuevo Color
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <input
            type="text"
            placeholder="Buscar por nombre o código hex..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* List Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400 font-medium">Cargando catálogo...</p>
            </div>
          ) : filteredColors.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <span className="text-4xl mb-3 block">🔎</span>
               <p className="text-gray-500 font-bold">No se encontraron colores</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {filteredColors.map((item: any) => (
                <div 
                  key={item.id} 
                  className="group relative bg-white p-2 border border-gray-100 rounded-[1.8rem] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div 
                    className="aspect-square w-full rounded-[1.3rem] mb-2 shadow-inner border border-black/5 relative overflow-hidden"
                    style={{ backgroundColor: item.codigo_hex }}
                  >
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[1px] transition-all duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                       <button 
                         onClick={(e) => { e.stopPropagation(); openModal(item); }} 
                         className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg text-sm"
                       >
                         ✎
                       </button>
                       <button 
                         onClick={(e) => { 
                           e.stopPropagation();
                           if(window.confirm('¿Seguro que desea eliminar permanentemente este color?')) {
                             deleteMutation.mutate(item.id);
                           } 
                         }} 
                         className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg text-sm"
                       >
                         ✕
                       </button>
                    </div>
                  </div>
                  <div className="px-1 text-center">
                    <p className="text-[10px] font-bold text-gray-900 truncate">{item.nombre}</p>
                    <p className="text-[9px] font-mono text-gray-400">{item.codigo_hex}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <h2 className="text-xl font-black text-gray-900">{editingItem ? 'Editar Color' : 'Nuevo Color'}</h2>
               <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 transition-colors text-2xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre del Color</label>
                <input 
                  autoFocus required type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData(p => ({...p, nombre: e.target.value}))} 
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tono</label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <input 
                    type="color" 
                    value={formData.codigo_hex} 
                    onChange={e => setFormData(p => ({...p, codigo_hex: e.target.value}))} 
                    className="h-14 w-14 rounded-xl cursor-pointer border-0 p-0 overflow-hidden bg-transparent" 
                  />
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={formData.codigo_hex} 
                      onChange={e => setFormData(p => ({...p, codigo_hex: e.target.value}))} 
                      className="w-full bg-transparent text-xl font-mono font-black text-gray-800 outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-2xl transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending} 
                  className="flex-1 py-4 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-2xl transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

