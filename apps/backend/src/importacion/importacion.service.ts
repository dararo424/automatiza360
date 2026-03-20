import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportResult {
  importados: number;
  errores: number;
  total: number;
  detalles?: string[];
}

@Injectable()
export class ImportacionService {
  constructor(private readonly prisma: PrismaService) {}

  async importarContactos(tenantId: string, fileBuffer: Buffer): Promise<ImportResult> {
    const text = fileBuffer.toString('utf-8');
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) return { importados: 0, errores: 0, total: 0 };

    // Skip header row
    const dataLines = lines.slice(1);
    let importados = 0;
    let errores = 0;
    const detalles: string[] = [];

    for (const line of dataLines) {
      const cols = this.parseCsvLine(line);
      const [telefono, nombre, email, notas, etiquetas] = cols;

      if (!telefono?.trim()) {
        errores++;
        detalles.push(`Línea omitida — teléfono requerido: "${line}"`);
        continue;
      }

      try {
        await this.prisma.contact.upsert({
          where: { tenantId_phone: { tenantId, phone: telefono.trim() } },
          create: {
            tenantId,
            phone: telefono.trim(),
            name: nombre?.trim() || null,
            email: email?.trim() || null,
            notes: notas?.trim() || null,
            tags: etiquetas?.trim() || null,
          },
          update: {
            name: nombre?.trim() || undefined,
            email: email?.trim() || undefined,
            notes: notas?.trim() || undefined,
            tags: etiquetas?.trim() || undefined,
          },
        });
        importados++;
      } catch {
        errores++;
        detalles.push(`Error al importar teléfono ${telefono}`);
      }
    }

    return { importados, errores, total: dataLines.length, detalles };
  }

  async importarProductos(tenantId: string, fileBuffer: Buffer): Promise<ImportResult> {
    const text = fileBuffer.toString('utf-8');
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) return { importados: 0, errores: 0, total: 0 };

    const dataLines = lines.slice(1);
    let importados = 0;
    let errores = 0;
    const detalles: string[] = [];

    for (const line of dataLines) {
      const cols = this.parseCsvLine(line);
      const [nombre, descripcion, precioStr, stockStr, stockMinimoStr, categoria] = cols;

      if (!nombre?.trim()) {
        errores++;
        detalles.push(`Línea omitida — nombre requerido: "${line}"`);
        continue;
      }

      const precio = parseFloat(precioStr?.trim() ?? '0');
      const stock = parseInt(stockStr?.trim() ?? '0', 10);
      const minStock = parseInt(stockMinimoStr?.trim() ?? '5', 10);

      if (isNaN(precio)) {
        errores++;
        detalles.push(`Precio inválido para producto "${nombre}"`);
        continue;
      }

      try {
        // Try to find existing product by name (case insensitive)
        const existing = await this.prisma.product.findFirst({
          where: {
            tenantId,
            name: { equals: nombre.trim(), mode: 'insensitive' },
          },
        });

        if (existing) {
          await this.prisma.product.update({
            where: { id: existing.id },
            data: {
              description: descripcion?.trim() || undefined,
              price: precio,
              stock: isNaN(stock) ? undefined : stock,
              minStock: isNaN(minStock) ? undefined : minStock,
            },
          });
        } else {
          await this.prisma.product.create({
            data: {
              tenantId,
              name: nombre.trim(),
              description: descripcion?.trim() || null,
              price: precio,
              stock: isNaN(stock) ? 0 : stock,
              minStock: isNaN(minStock) ? 5 : minStock,
            },
          });
        }
        importados++;
      } catch {
        errores++;
        detalles.push(`Error al importar producto "${nombre}"`);
      }
    }

    return { importados, errores, total: dataLines.length, detalles };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
