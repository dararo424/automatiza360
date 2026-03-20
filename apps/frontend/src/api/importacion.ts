import api from './axios';

export interface ImportResult {
  importados: number;
  errores: number;
  total: number;
  detalles?: string[];
}

export function importarContactos(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  return api.post('/importacion/contactos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
}

export function importarProductos(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  return api.post('/importacion/productos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
}
