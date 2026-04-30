import api from '../../lib/axios';
import type { PaginatedResult, Order } from '../../types';

export const orderApi = {
  getAll: async (params: Record<string, any> = {}): Promise<PaginatedResult<Order>> => {
    const { data } = await api.get('/ordenes', { params });
    return data;
  },
  getById: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/ordenes/${id}`);
    return data;
  },
  create: async (body: { mercado: string; observaciones?: string }): Promise<Order> => {
    const { data } = await api.post('/ordenes', body);
    return data;
  },
  addItem: async (orderId: string, body: { producto_id: number; color_id?: number; cantidad: number; pvp_venezuela?: number }) => {
    const { data } = await api.post(`/ordenes/${orderId}/items`, body);
    return data;
  },
  removeItem: async (orderId: string, itemId: string) => {
    const { data } = await api.delete(`/ordenes/${orderId}/items/${itemId}`);
    return data;
  },
  updateStatus: async (orderId: string, estado: string): Promise<Order> => {
    const { data } = await api.patch(`/ordenes/${orderId}/estado`, { estado });
    return data;
  },
  update: async (orderId: string, payload: { observaciones: string }): Promise<Order> => {
    const { data } = await api.patch(`/ordenes/${orderId}`, payload);
    return data;
  },
  remove: async (orderId: string) => {
    const { data } = await api.delete(`/ordenes/${orderId}`);
    return data;
  },
  getPendingCount: async (): Promise<{ count: number }> => {
    const { data } = await api.get('/ordenes/pendientes/count');
    return data;
  },
};
