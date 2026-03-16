import api from './axios';

export const adminApi = {
  getMetricas: () => api.get('/admin/metricas').then((r) => r.data),
  getTenants: (params?: { status?: string; industry?: string; search?: string }) =>
    api.get('/admin/tenants', { params }).then((r) => r.data),
  getTenant: (id: string) => api.get(`/admin/tenants/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string, plan?: string) =>
    api.put(`/admin/tenants/${id}/status`, { status, plan }).then((r) => r.data),
  extenderTrial: (id: string, days: number) =>
    api.post(`/admin/tenants/${id}/extend-trial`, { days }).then((r) => r.data),
};
