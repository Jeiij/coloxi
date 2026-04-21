import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, catalogApi } from './productApi';

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    nombre_corto: '',
    presentacion: 'Galón',
    capacidad_gal: 1.0,
    equivalencia_kg: 4.5,
    costo_unitario_sin_iva: 0,
    pvp_colombia: 0,
    categoria_id: '',
    linea_id: '',
    marca_id: '',
    observaciones: '',
    activo: true,
  });
  
  const [coloresSeleccionados, setColoresSeleccionados] = useState<number[]>([]);

  // Cargar catalogos
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const { data: lines } = useQuery({ queryKey: ['lines'], queryFn: catalogApi.getLines });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: catalogApi.getBrands });
  const { data: colors } = useQuery({ queryKey: ['colors'], queryFn: catalogApi.getColors });

  // Cargar producto si estamos editando
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        codigo: product.codigo,
        nombre: product.nombre,
        nombre_corto: product.nombre_corto || '',
        presentacion: product.presentacion,
        capacidad_gal: Number(product.capacidad_gal) || 0,
        equivalencia_kg: Number(product.equivalencia_kg) || 0,
        costo_unitario_sin_iva: Number(product.costo_unitario_sin_iva) || 0,
        pvp_colombia: Number(product.pvp_colombia) || 0,
        categoria_id: String(product.categoria?.id || ''),
        linea_id: String(product.linea?.id || ''),
        marca_id: String(product.marca?.id || ''),
        observaciones: product.observaciones || '',
        activo: product.activo,
      });
      setColoresSeleccionados(product.colores?.map((c: any) => c.id) || []);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditing ? productApi.update(id!, data) : productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/productos');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const toggleColor = (colorId: number) => {
    setColoresSeleccionados(prev => 
      prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : undefined,
      linea_id: formData.linea_id ? Number(formData.linea_id) : undefined,
      marca_id: formData.marca_id ? Number(formData.marca_id) : undefined,
      colores_ids: coloresSeleccionados,
    };
    saveMutation.mutate(payload);
  };

  if (isEditing && isLoadingProduct) return <div className="p-12 text-center text-gray-500">Cargando producto...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
        <button
          onClick={() => navigate('/productos')}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          ← Volver al listado
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {saveMutation.isError && (
          <div className="bg-red-50 p-4 border-b border-red-100 text-red-700 text-sm">
            Ocurrió un error al guardar el producto.
          </div>
        )}

        <div className="p-6 md:p-8 space-y-8">
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Identificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Código Único *</label>
                <input required type="text" name="codigo" value={formData.codigo} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Comercial *</label>
                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Corto (Opcional)</label>
                <input type="text" name="nombre_corto" value={formData.nombre_corto} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData(p => ({...p, activo: e.target.checked}))} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Producto Activo</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* SECCIÓN 2: CLASIFICACIÓN */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Clasificación y Atributos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
                <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Línea</label>
                <select name="linea_id" value={formData.linea_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {lines?.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Marca</label>
                <select name="marca_id" value={formData.marca_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {brands?.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Presentación Primaria *</label>
                <input required type="text" name="presentacion" value={formData.presentacion} onChange={handleChange} placeholder="Ej: Galón" className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Capacidad (Galones) *</label>
                <input required type="number" step="0.01" name="capacidad_gal" value={formData.capacidad_gal} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Equivalencia (Kg) *</label>
                <input required type="number" step="0.01" name="equivalencia_kg" value={formData.equivalencia_kg} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-xs font-medium text-gray-500 mb-2">Colores Disponibles (Opcional)</label>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                {colors?.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                      coloresSeleccionados.includes(c.id) 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.codigo_hex }}></span>
                    {c.nombre}
                  </button>
                ))}
                {colors?.length === 0 && <span className="text-sm text-gray-400">No hay colores registrados.</span>}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* SECCIÓN 3: FINANCIERO E INVENTARIO */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Financiero e Inventario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Costo Unit. (Sin IVA) *</label>
                <input required type="number" step="0.01" name="costo_unitario_sin_iva" value={formData.costo_unitario_sin_iva} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PVP Sugerido Colombia *</label>
                <input required type="number" step="0.01" name="pvp_colombia" value={formData.pvp_colombia} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 font-semibold bg-blue-50/30" />
              </div>
            </div>
          </div>
          
          <hr className="border-gray-100" />
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
            <textarea name="observaciones" rows={3} value={formData.observaciones} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/productos')} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50">
            {saveMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
