import api from './axios';

export interface DashboardMetricas {
  ordenesHoy: number;
  ordenesMes: number;
  ingresosMes: number;
  citasHoy: number;
  citasMes: number;
  citasPendientes: number;
  conversacionesMes: number;
  totalProductos: number;
  productosStockBajo: number;
  ticketsAbiertos: number;
  ticketsResueltosHoy: number;
  ultimasOrdenes: Array<{
    id: string;
    clienteNombre: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  ultimasCitas: Array<{
    id: string;
    clienteName: string;
    serviceName: string;
    date: string;
    status: string;
    createdAt: string;
  }>;
}

export function getMetricasDashboard(): Promise<DashboardMetricas> {
  return api.get('/dashboard/metricas').then((r) => r.data);
}
