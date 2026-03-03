import axios from 'axios';
import type { ImportedProduct } from '../types';

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL ?? 'http://localhost:8000',
});

export interface ImportResult {
  supplierName: string | null;
  products: ImportedProduct[];
}

export async function importarInventario(file: File): Promise<ImportResult> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await aiApi.post<{ supplier_name: string | null; products: ImportedProduct[] }>(
    '/import-inventory',
    fd,
  );
  return {
    supplierName: r.data.supplier_name,
    products: r.data.products,
  };
}
