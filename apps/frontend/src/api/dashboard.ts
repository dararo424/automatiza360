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

export interface BotMetricas {
  totalConversaciones: number;
  conversacionesMes: number;
  totalMensajes: number;
  mensajesMes: number;
  mensajesEntrantes: number;
  mensajesSalientes: number;
  tasaRespuesta: number;
  usoCuotaMes: number;
  plan: string;
}

export function getBotMetricas(): Promise<BotMetricas> {
  return api.get('/dashboard/bot-metricas').then((r) => r.data);
}
