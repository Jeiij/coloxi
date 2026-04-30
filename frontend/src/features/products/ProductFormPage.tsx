import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, catalogApi } from './productApi';

// ─── Constantes ───────────────────────────────────────────────────────────────
const BACKEND_BASE = 'http://localhost:3000';

// ─── Componente ImageUploader ─────────────────────────────────────────────────
interface ImageUploaderProps {
  currentImageUrl: string | null;
  currentImageId: string | null;
  productId: number | null; // null si estamos creando (sin ID aún)
  onFileSelected: (file: File | null) => void;
  onDeleteExisting: () => void;
  isUploading: boolean;
}

function ImageUploader({
  currentImageUrl,
  currentImageId,
  productId,
  onFileSelected,
  onDeleteExisting,
  isUploading,
}: ImageUploaderProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    setLocalFile(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveLocal = () => {
    setLocalPreview(null);
    setLocalFile(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayUrl = localPreview || (currentImageUrl ? `${BACKEND_BASE}${currentImageUrl}` : null);

  return (
    <div className="flex flex-col gap-2">
      {/* Cuadro de imagen */}
      <div
        className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all
          ${displayUrl
            ? 'border-gray-200 shadow-sm group cursor-pointer'
            : 'border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 cursor-pointer'
          }`}
        onClick={() => !displayUrl && inputRef.current?.click()}
      >
        {isUploading ? (
          /* Cargando */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <span className="text-xs text-blue-500 font-medium">Subiendo...</span>
          </div>
        ) : displayUrl ? (
          /* Preview con overlay de acciones */
          <>
            <img src={displayUrl} alt="Imagen del producto" className="w-full h-full object-cover" />
            {/* Overlay al hacer hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-gray-800 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 shadow transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Cambiar imagen
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (localFile) handleRemoveLocal();
                  else if (currentImageId && productId) onDeleteExisting();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 shadow transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Quitar imagen
              </button>
            </div>
            {/* Badge nueva */}
            {localFile && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                Nueva
              </div>
            )}
          </>
        ) : (
          /* Estado vacío */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Haz clic para subir</p>
              <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG o WebP · Máx. 5 MB</p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir imagen
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    presentacion: 'Galón',
    capacidad_gal: '' as string | number,
    equivalencia_kg: '' as string | number,
    costo_unitario_sin_iva: '' as string | number,
    pvp_colombia: '' as string | number,
    pvp_venezuela: '' as string | number,
    observaciones: '',
    activo: true,
  });

  const [coloresSeleccionados, setColoresSeleccionados] = useState<number[]>([]);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // Imagen actual del servidor (al editar)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // Cargar catálogos
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
        presentacion: product.presentacion,
        capacidad_gal: product.capacidad_gal ?? '',
        equivalencia_kg: product.equivalencia_kg ?? '',
        costo_unitario_sin_iva: product.costo_unitario_sin_iva ?? '',
        pvp_colombia: product.pvp_colombia ?? '',
        pvp_venezuela: product.pvp_venezuela ?? '',
        observaciones: product.observaciones || '',
        activo: product.activo,
      });
      setColoresSeleccionados(product.colores?.map((c: any) => c.id) || []);

      // Cargar imagen principal si existe
      const principal = product.imagenes?.find((img: any) => img.es_principal) || product.imagenes?.[0];
      if (principal) {
        setCurrentImageUrl(principal.url_imagen);
        setCurrentImageId((principal as any).id);
      }
    }
  }, [product]);

  // Mutation para subir imagen
  const uploadImageMutation = useMutation({
    mutationFn: ({ productId, file }: { productId: number; file: File }) =>
      productApi.uploadImage(productId, file),
    onSuccess: (data) => {
      setCurrentImageUrl(data.url_imagen);
      setCurrentImageId(data.id);
      setPendingImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  // Mutation para eliminar imagen
  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imagenId }: { productId: number; imagenId: string }) =>
      productApi.deleteImage(productId, imagenId),
    onSuccess: () => {
      setCurrentImageUrl(null);
      setCurrentImageId(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  // Mutation principal de guardado
  const saveMutation = useMutation({
    mutationFn: (data: any) => isEditing ? productApi.update(id!, data) : productApi.create(data),
    onSuccess: async (savedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Si hay imagen pendiente, subirla ahora que tenemos el ID
      if (pendingImageFile) {
        const productId = savedProduct.id;
        await uploadImageMutation.mutateAsync({ productId, file: pendingImageFile });
      }

      navigate('/productos');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    const numFields = ['capacidad_gal', 'equivalencia_kg', 'costo_unitario_sin_iva', 'pvp_colombia', 'pvp_venezuela'];
    if (numFields.includes(name)) {
      // Reemplazar coma por punto y quitar caracteres no numéricos
      let val = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
      
      // Asegurar que solo haya un punto decimal
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      value = val;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleColor = (colorId: number) => {
    setColoresSeleccionados(prev =>
      prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const toNum = (val: any) => {
      const parsed = Number(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const { codigo, ...cleanFormData } = formData;

    const payload = {
      ...cleanFormData,
      capacidad_gal: toNum(formData.capacidad_gal),
      equivalencia_kg: toNum(formData.equivalencia_kg),
      costo_unitario_sin_iva: toNum(formData.costo_unitario_sin_iva),
      pvp_colombia: toNum(formData.pvp_colombia),
      pvp_venezuela: toNum(formData.pvp_venezuela),
      colores_ids: coloresSeleccionados,
    };

    if (isEditing) {
      const { codigo, ...updatePayload } = payload;
      saveMutation.mutate(updatePayload);
    } else {
      saveMutation.mutate(payload);
    }
  };

  const handleDeleteExistingImage = () => {
    if (!id || !currentImageId) return;
    if (window.confirm('¿Seguro que deseas eliminar la imagen del producto?')) {
      deleteImageMutation.mutate({ productId: Number(id), imagenId: currentImageId });
    }
  };

  // Cuando se edita y se sube nueva imagen directamente (sin esperar al submit)
  const handleFileSelectedInEdit = async (file: File | null) => {
    if (isEditing && file && id) {
      // En modo edición, subimos la imagen inmediatamente
      setPendingImageFile(null);
      await uploadImageMutation.mutateAsync({ productId: Number(id), file });
    } else {
      // En modo creación, guardamos el archivo para subirlo después del POST
      setPendingImageFile(file);
    }
  };

  const isSubmitting = saveMutation.isPending || uploadImageMutation.isPending;

  if (isEditing && isLoadingProduct) return <div className="p-12 text-center text-gray-500">Cargando producto...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Completa la información técnica y comercial.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/productos')}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl shadow-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (Principal) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
            
            {/* Header del recuadro + Activo */}
            <div className="flex justify-between items-center mb-2 pb-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 w-1.5 h-5 rounded-full"></span>
                Ficha del Producto
              </h2>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors uppercase">Producto Activo</span>
              </label>
            </div>

            {/* Información Básica */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre Del Producto</label>
                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Presentación Técnica (Rediseñado más fino) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/40 px-4 py-3 rounded-xl border border-blue-100/50 focus-within:ring-2 ring-blue-500">
                <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Presentación</label>
                <select required name="presentacion" value={formData.presentacion} onChange={handleChange} className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer">
                  <option value="Galón">Galón (GAL)</option>
                  <option value="Cuñete">Cuñete (CUÑ)</option>
                </select>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:ring-2 ring-blue-500">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Capacidad (Gal)</label>
                <input required type="text" name="capacidad_gal" value={formData.capacidad_gal} onChange={handleChange} placeholder="Ej. 1.00" className="w-full bg-transparent text-base font-bold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400" />
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus-within:ring-2 ring-blue-500">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Equivalencia (Kg)</label>
                <input required type="text" name="equivalencia_kg" value={formData.equivalencia_kg} onChange={handleChange} placeholder="Ej. 4.25" className="w-full bg-transparent text-base font-bold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Precios Comerciales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Costo Base s/IVA</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input type="text" name="costo_unitario_sin_iva" value={formData.costo_unitario_sin_iva} onChange={handleChange} className="w-full pl-7 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">PVP Colombia</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold">$</span>
                  <input type="text" name="pvp_colombia" value={formData.pvp_colombia} onChange={handleChange} className="w-full pl-7 pr-4 py-2.5 bg-blue-50/30 border border-blue-200 rounded-xl text-sm font-bold text-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-600 uppercase tracking-widest mb-1.5">PVP Venezuela</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</span>
                  <input required type="text" name="pvp_venezuela" value={formData.pvp_venezuela} onChange={handleChange} className="w-full pl-7 pr-4 py-2.5 bg-purple-50/30 border border-purple-200 rounded-xl text-sm font-bold text-purple-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="0" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Variantes y Colores */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Colores Disponibles</label>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{coloresSeleccionados.length} seleccionados</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colors?.map((c: any) => {
                  const isSelected = coloresSeleccionados.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-[1.02]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border shadow-sm border-black/10" style={{ backgroundColor: c.codigo_hex }}></span>
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
              {(!colors || colors.length === 0) && (
                 <p className="text-sm text-gray-400 italic mt-2">No hay colores disponibles en el sistema.</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Notas y Observaciones */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Notas Adicionales</label>
              <textarea name="observaciones" rows={4} value={formData.observaciones} onChange={handleChange} placeholder="Escribe aquí cualquier observación técnica, de proveedor o de manejo..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"></textarea>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Media) */}
        <div className="space-y-6">
          {/* Alertas de error */}
          {saveMutation.isError && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-sm font-medium flex flex-col gap-2">
              <div className="flex gap-2">
                <span className="text-lg">⚠️</span>
                <p>Error al guardar el producto:</p>
              </div>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1 ml-6">
                {Array.isArray((saveMutation.error as any)?.response?.data?.error?.message) 
                  ? (saveMutation.error as any).response.data.error.message.map((msg: string, i: number) => (
                      <li key={i}>{msg}</li>
                    ))
                  : <li>{(saveMutation.error as any)?.response?.data?.error?.message || (saveMutation.error as any)?.message || 'Error desconocido'}</li>
                }
              </ul>
            </div>
          )}
          {uploadImageMutation.isError && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-sm font-medium flex gap-2">
              <span className="text-lg">🖼️</span>
              <p>Error al subir la imagen. Verifica que sea JPG/PNG/WebP y menor a 5MB.</p>
            </div>
          )}

          {/* Card: Media Uploader */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Imagen Principal</h2>
            </div>
            <div className="p-6">
              <ImageUploader
                currentImageUrl={currentImageUrl}
                currentImageId={currentImageId}
                productId={id ? Number(id) : null}
                onFileSelected={handleFileSelectedInEdit}
                onDeleteExisting={handleDeleteExistingImage}
                isUploading={uploadImageMutation.isPending}
              />
            </div>
            {isEditing && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID Producto</p>
                <p className="text-sm font-mono text-gray-800">{product?.codigo}</p>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
