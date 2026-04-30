import api from '../../lib/axios';
import type { PaginatedResult, Product, CatalogItem, Color } from '../../types';

export const productApi = {
  getAll: async (params: Record<string, any> = {}): Promise<PaginatedResult<Product>> => {
    const { data } = await api.get('/productos', { params });
    return data;
  },
  getById: async (id: string | number): Promise<Product> => {
    const { data } = await api.get(`/productos/${id}`);
    return data;
  },
  getPriceHistory: async (id: string | number): Promise<any[]> => {
    const { data } = await api.get(`/productos/${id}/historial-precios`);
    return data;
  },
  getGlobalHistory: async (params: Record<string, any> = {}): Promise<PaginatedResult<any>> => {
    const { data } = await api.get('/productos/auditoria/historial-global', { params });
    return data;
  },
  create: async (payload: any): Promise<Product> => {
    const { data } = await api.post('/productos', payload);
    return data;
  },
  update: async (id: string | number, payload: any): Promise<Product> => {
    const { data } = await api.patch(`/productos/${id}`, payload);
    return data;
  },
  toggleActive: async (id: string | number): Promise<void> => {
    await api.patch(`/productos/${id}/estado`);
  },

  // ─── Imágenes ─────────────────────────────────────────────────────────────

  uploadImage: async (id: string | number, file: File): Promise<{ id: string; url_imagen: string }> => {
    const formData = new FormData();
    formData.append('imagen', file);
    const { data } = await api.post(`/productos/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (id: string | number, imagenId: string): Promise<void> => {
    await api.delete(`/productos/${id}/imagen/${imagenId}`);
  },
};

export const catalogApi = {
  getCategories: async (): Promise<CatalogItem[]> => {
    const { data } = await api.get('/catalogos/categorias');
    return data;
  },
  getLines: async (): Promise<CatalogItem[]> => {
    const { data } = await api.get('/catalogos/lineas');
    return data;
  },
  getBrands: async (): Promise<CatalogItem[]> => {
    const { data } = await api.get('/catalogos/marcas');
    return data;
  },
  getColors: async (): Promise<Color[]> => {
    const { data } = await api.get('/catalogos/colores');
    return data;
  },
};
