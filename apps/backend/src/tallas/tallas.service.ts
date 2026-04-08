import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

interface FilaTabla {
  Talla: string;
  Altura_min: number;
  Altura_max: number;
  Peso_min: number;
  Peso_max: number;
  Cintura_min: number;
  Cintura_max: number;
}

@Injectable()
export class TallasService {
  constructor(private prisma: PrismaService) {}

  async cargarDesdeBuffer(tenantId: string, buffer: Buffer): Promise<{ importadas: number }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json<FilaTabla>(sheet);

    const columnas = ['Talla', 'Altura_min', 'Altura_max', 'Peso_min', 'Peso_max', 'Cintura_min', 'Cintura_max'];
    if (filas.length === 0 || !columnas.every(c => c in filas[0])) {
      throw new BadRequestException(`El archivo debe tener las columnas: ${columnas.join(', ')}`);
    }

    await this.prisma.tallaConfig.deleteMany({ where: { tenantId } });
    await this.prisma.tallaConfig.createMany({
      data: filas.map(f => ({
        tenantId,
        talla: String(f.Talla),
        alturaMin: Number(f.Altura_min),
        alturaMax: Number(f.Altura_max),
        pesoMin: Number(f.Peso_min),
        pesoMax: Number(f.Peso_max),
        cinturaMin: Number(f.Cintura_min),
        cinturaMax: Number(f.Cintura_max),
      })),
    });

    return { importadas: filas.length };
  }

  async sincronizarGoogleSheets(tenantId: string, sheetUrl: string): Promise<{ importadas: number }> {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new BadRequestException('URL de Google Sheets inválida');

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await fetch(csvUrl);
    if (!response.ok) throw new BadRequestException('No se pudo acceder al Google Sheet. Verifica que sea público.');

    const csvText = await response.text();
    const buffer = Buffer.from(csvText, 'utf-8');

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json<FilaTabla>(sheet);

    const columnas = ['Talla', 'Altura_min', 'Altura_max', 'Peso_min', 'Peso_max', 'Cintura_min', 'Cintura_max'];
    if (filas.length === 0 || !columnas.every(c => c in filas[0])) {
      throw new BadRequestException(`El Sheet debe tener las columnas: ${columnas.join(', ')}`);
    }

    await this.prisma.tallaConfig.deleteMany({ where: { tenantId } });
    await this.prisma.tallaConfig.createMany({
      data: filas.map(f => ({
        tenantId,
        talla: String(f.Talla),
        alturaMin: Number(f.Altura_min),
        alturaMax: Number(f.Altura_max),
        pesoMin: Number(f.Peso_min),
        pesoMax: Number(f.Peso_max),
        cinturaMin: Number(f.Cintura_min),
        cinturaMax: Number(f.Cintura_max),
      })),
    });

    return { importadas: filas.length };
  }

  async getConfig(tenantId: string) {
    return this.prisma.tallaConfig.findMany({
      where: { tenantId },
      orderBy: { alturaMin: 'asc' },
    });
  }

  async getHistorial(tenantId: string) {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const [consultas, totalMes] = await Promise.all([
      this.prisma.tallaConsulta.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.tallaConsulta.count({
        where: {
          tenantId,
          createdAt: { gte: inicioMes },
        },
      }),
    ]);
    return { consultas, totalMes };
  }

  recomendarTalla(
    configs: Awaited<ReturnType<TallasService['getConfig']>>,
    altura: number,
    peso: number,
    cintura?: number,
  ): { talla: string; confianza: 'ALTA' | 'MEDIA' | 'BAJA'; advertencia?: string } {
    const candidatos = configs.filter(c => {
      const alturaOk = altura >= c.alturaMin && altura <= c.alturaMax;
      const pesoOk = peso >= c.pesoMin && peso <= c.pesoMax;
      const cinturaOk = cintura != null ? cintura >= c.cinturaMin && cintura <= c.cinturaMax : true;
      return alturaOk && pesoOk && cinturaOk;
    });

    if (candidatos.length === 1) {
      return { talla: candidatos[0].talla, confianza: 'ALTA' };
    }

    if (candidatos.length > 1) {
      return {
        talla: candidatos[0].talla,
        confianza: 'MEDIA',
        advertencia: `Podrías quedar entre ${candidatos.map(c => c.talla).join(' y ')}. Considera medir tu cintura para mayor precisión.`,
      };
    }

    // No hay coincidencia exacta — buscar el más cercano por altura
    const porAltura = [...configs]
      .map(c => ({
        ...c,
        distancia: Math.abs((c.alturaMin + c.alturaMax) / 2 - altura),
      }))
      .sort((a, b) => a.distancia - b.distancia);

    return {
      talla: porAltura[0].talla,
      confianza: 'BAJA',
      advertencia: 'Tu talla es aproximada. Te recomendamos probarte antes de comprar.',
    };
  }

  async guardarConsulta(data: {
    tenantId: string;
    clientePhone: string;
    altura: number;
    peso: number;
    cintura?: number;
    tallaRecomendada: string;
    confianza: string;
  }) {
    return this.prisma.tallaConsulta.create({ data });
  }

  async consultarTallaPorBot(
    tenantId: string,
    clientePhone: string,
    altura: number,
    peso: number,
    cintura?: number,
  ) {
    const configs = await this.getConfig(tenantId);
    if (configs.length === 0) {
      return { error: 'La tienda aún no ha cargado su tabla de tallas.' };
    }

    const resultado = this.recomendarTalla(configs, altura, peso, cintura);
    await this.guardarConsulta({
      tenantId,
      clientePhone,
      altura,
      peso,
      cintura,
      tallaRecomendada: resultado.talla,
      confianza: resultado.confianza,
    });

    return resultado;
  }
}
