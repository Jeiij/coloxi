import api from '../../lib/axios';

export const inventoryApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/inventario', { params }).then((r) => r.data),

  getStats: () =>
    api.get('/inventario/stats').then((r) => r.data),

  create: (data: { producto_id: string; stock_actual?: number; stock_minimo?: number }) =>
    api.post('/inventario', data).then((r) => r.data),

  update: (id: string, data: { stock_actual?: number; stock_minimo?: number }) =>
    api.patch(`/inventario/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/inventario/${id}`).then((r) => r.data),
};
