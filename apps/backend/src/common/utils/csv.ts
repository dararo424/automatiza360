/**
 * Genera CSV compatible con Excel (BOM UTF-8, separador coma, escape RFC 4180).
 */
export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ];
  // BOM para que Excel abra acentos y ñ correctamente
  return '﻿' + lines.join('\r\n');
}
