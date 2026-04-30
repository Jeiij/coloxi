import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: parametros, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/parametros')).data,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ clave, valor }: { clave: string; valor: string }) => 
      (await api.patch(`/parametros/${clave}`, { valor })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditingKey(null);
      toast.success('Parámetro actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el parámetro'),
  });

  const startEdit = (param: any) => {
    setEditingKey(param.clave);
    setEditValue(param.valor);
  };

  const handleSave = (clave: string) => {
    if (!editValue.trim()) return;
    updateMutation.mutate({ clave, valor: editValue });
  };

  if (isLoading) return <div className="p-12 text-center text-gray-400">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 text-sm mt-1">Administra los parámetros globales de COLOXI</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-50">
          {parametros?.map((p: any) => (
            <li key={p.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-gray-900 tracking-tight">
                    {p.clave.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">{p.descripcion}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2 w-48">
                  {editingKey === p.clave ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => {
                          let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) {
                            val = parts[0] + '.' + parts.slice(1).join('');
                          }
                          setEditValue(val);
                        }}
                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono font-medium"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingKey(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                        <button onClick={() => handleSave(p.clave)} disabled={updateMutation.isPending} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                          {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-mono font-medium text-gray-900">
                        {p.valor}
                      </div>
                      <button onClick={() => startEdit(p)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition">
                        ✏️ Modificar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
