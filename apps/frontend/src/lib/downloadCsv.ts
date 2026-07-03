export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

/** Descarga un CSV autenticado desde el backend y dispara el guardado. */
export async function downloadCsv(path: string, filename: string) {
  const token = localStorage.getItem('token');
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Export falló: ${resp.status}`);
  const blob = await resp.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
