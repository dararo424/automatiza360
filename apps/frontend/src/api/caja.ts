import api from './axios';

export interface CorteDiario {
  fecha: string;
  totalOrdenes: number;
  totalIngresos: number;
  totalGastos: number;
  ganancia: number;
  porMetodoPago: { metodo: string; total: number; count: number }[];
  ordenes: Array<{
    id: string;
    number: number;
    status: string;
    total: number;
    phone: string | null;
    notes: string | null;
    createdAt: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }>;
  gastos: Array<{
    id: string;
    descripcion: string;
    monto: number;
    categoria: string;
    fecha: string;
  }>;
}

export const getCorteDiario = (fecha?: string): Promise<CorteDiario> =>
  api.get('/caja/corte', { params: fecha ? { fecha } : {} }).then((r) => r.data);
