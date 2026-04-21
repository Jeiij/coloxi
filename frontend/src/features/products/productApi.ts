import api from '../../lib/axios';
import type { PaginatedResult, Product, CatalogItem, Color } from '../../types';

export const productApi = {
  getAll: async (params: Record<string, any> = {}): Promise<PaginatedResult<Product>> => {
    const { data } = await api.get('/productos', { params });
    return data;
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/productos/${id}`);
    return data;
  },
  create: async (payload: any): Promise<Product> => {
    const { data } = await api.post('/productos', payload);
    return data;
  },
  update: async (id: string, payload: any): Promise<Product> => {
    const { data } = await api.patch(`/productos/${id}`, payload);
    return data;
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
