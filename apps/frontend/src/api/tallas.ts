import api from './axios';

export interface TallaConfig {
  id: string;
  talla: string;
  alturaMin: number;
  alturaMax: number;
  pesoMin: number;
  pesoMax: number;
  cinturaMin: number;
  cinturaMax: number;
  createdAt: string;
}

export interface TallaConsulta {
  id: string;
  clientePhone: string;
  altura: number;
  peso: number;
  cintura?: number;
  tallaRecomendada: string;
  confianza: 'ALTA' | 'MEDIA' | 'BAJA';
  createdAt: string;
}

export interface HistorialTallas {
  consultas: TallaConsulta[];
  totalMes: number;
}

export async function getTallasConfig(): Promise<TallaConfig[]> {
  const { data } = await api.get('/tallas/config');
  return data;
}

export async function getHistorialTallas(): Promise<HistorialTallas> {
  const { data } = await api.get('/tallas/historial');
  return data;
}

export async function uploadTallasFile(file: File): Promise<{ importadas: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/tallas/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function sincronizarGoogleSheets(sheetUrl: string): Promise<{ importadas: number }> {
  const { data } = await api.post('/tallas/sync-sheets', { sheetUrl });
  return data;
}
