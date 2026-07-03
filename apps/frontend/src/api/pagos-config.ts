import api from './axios';

export type PaymentMode = 'MANUAL' | 'TEXT' | 'WOMPI';

export interface PagosConfig {
  paymentMode: PaymentMode;
  paymentText: string | null;
  wompiPublicKey: string | null;
  wompiIntegritySecretConfigured: boolean;
}

export interface ActualizarPagosConfigDto {
  paymentMode?: PaymentMode;
  paymentText?: string;
  wompiPublicKey?: string;
  wompiIntegritySecret?: string;
}

export const getPagosConfig = (): Promise<PagosConfig> =>
  api.get('/perfil/pagos-config').then((r) => r.data);

export const actualizarPagosConfig = (
  dto: ActualizarPagosConfigDto,
): Promise<PagosConfig> =>
  api.patch('/perfil/pagos-config', dto).then((r) => r.data);
