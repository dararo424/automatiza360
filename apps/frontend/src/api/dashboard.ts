import api from './axios';

export interface DashboardMetricas {
  ordenesHoy: number;
  ordenesAyer: number;
  ordenesMes: number;
  ingresosMes: number;
  ingresosAyer: number;
  citasHoy: number;
  citasAyer: number;
  citasMes: number;
  citasPendientes: number;
  conversacionesMes: number;
  totalProductos: number;
  productosStockBajo: number;
  ticketsAbiertos: number;
  ticketsResueltosHoy: number;
  contactosNuevosSemana: number;
  contactosTotales: number;
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

export interface TendenciaDia {
  date: string;
  ordenes: number;
  citas: number;
  ingresos: number;
}

export function getTendencias(days: number = 30): Promise<TendenciaDia[]> {
  return api.get(`/dashboard/tendencias?days=${days}`).then((r) => r.data);
}

export interface RoiData {
  mensajesAutomatizados: number;
  minutosAhorrados: number;
  horasAhorradas: number;
  ahorroEstimadoCOP: number;
  contactosTotales: number;
  campañasEnviadas: number;
  ordenesViaBot: number;
}

export function getRoi(): Promise<RoiData> {
  return api.get('/dashboard/roi').then((r) => r.data);
}
