import axios from 'axios';
import type { ImportedProduct } from '../types';

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000',
});

export async function importarInventario(file: File): Promise<ImportedProduct[]> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await aiApi.post<{ products: ImportedProduct[] }>('/import-inventory', fd);
  return r.data.products;
}
