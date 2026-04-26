import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { EmailService } from '../email/email.service';

type Tendencia = { date: string; ordenes: number; citas: number; ingresos: number };

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);
  private readonly twilio: ReturnType<typeof Twilio> | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
    private readonly email: EmailService,
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    this.twilio = sid && token ? Twilio(sid, token) : null;
  }

  // ── Quickchart helpers ───────────────────────────────────────────────────────

  private encodeChart(config: object): string {
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&width=700&height=350&backgroundColor=white`;
  }

  private async createChartUrl(config: object): Promise<string> {
    const res = await fetch('https://quickchart.io/chart/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart: config, width: 700, height: 350, backgroundColor: 'white', devicePixelRatio: 2 }),
    });
    const data = await res.json() as { success: boolean; url: string };
    if (!data.success) throw new Error('Quickchart: no se pudo crear la gráfica');
    return data.url;
  }

  private buildIngresosChart(tendencias: Tendencia[], titulo: string): object {
    return {
      type: 'line',
      data: {
        labels: tendencias.map(t => t.date),
        datasets: [{
          label: 'Ingresos COP',
          data: tendencias.map(t => t.ingresos),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        }],
      },
      options: {
        plugins: { title: { display: true, text: titulo, font: { size: 16 } } },
        scales: { y: { ticks: { callback: 'value => "$" + value.toLocaleString()' } } },
      },
    };
  }

  private buildOrdenesChart(tendencias: Tendencia[], titulo: string): object {
    return {
      type: 'bar',
      data: {
        labels: tendencias.map(t => t.date),
        datasets: [
          { label: 'Órdenes', data: tendencias.map(t => t.ordenes), backgroundColor: 'rgba(99,102,241,0.8)' },
          { label: 'Citas', data: tendencias.map(t => t.citas), backgroundColor: 'rgba(34,197,94,0.8)' },
        ],
      },
      options: {
        plugins: { title: { display: true, text: titulo, font: { size: 16 } } },
        scales: { x: { stacked: false }, y: { stacked: false } },
      },
    };
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────────

  async enviarGraficaWhatsApp(
    tenantId: string,
    phone: string,
    tipo: string,
    periodo: string,
  ): Promise<{ ok: boolean; chartUrl: string }> {
    const dias = periodo === 'mes' ? 30 : 7;
    const [tendencias, tenant] = await Promise.all([
      this.dashboard.getTendencias(tenantId, dias),
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { twilioNumber: true, name: true } }),
    ]);

    if (!this.twilio || !tenant?.twilioNumber) {
      throw new Error('Twilio no configurado para este tenant');
    }

    const label = periodo === 'mes' ? 'Últimos 30 días' : 'Últimos 7 días';
    const config = tipo === 'ventas' || tipo === 'ingresos'
      ? this.buildIngresosChart(tendencias, `Ingresos — ${label}`)
      : this.buildOrdenesChart(tendencias, `Órdenes y Citas — ${label}`);

    const chartUrl = await this.createChartUrl(config);

    const total = tendencias.reduce((s, t) => s + t.ingresos, 0);
    const totalOrdenes = tendencias.reduce((s, t) => s + t.ordenes, 0);
    const body =
      tipo === 'ventas' || tipo === 'ingresos'
        ? `📊 *Ingresos — ${label}*\nTotal: $${total.toLocaleString('es-CO')} COP`
        : `📊 *Actividad — ${label}*\nÓrdenes: ${totalOrdenes} · Citas: ${tendencias.reduce((s, t) => s + t.citas, 0)}`;

    await this.twilio.messages.create({
      from: `whatsapp:${tenant.twilioNumber}`,
      to: `whatsapp:${phone}`,
      body,
      mediaUrl: [chartUrl],
    });

    this.logger.log(`Gráfica WhatsApp enviada a ${phone} (tenant=${tenantId} tipo=${tipo})`);
    return { ok: true, chartUrl };
  }

  // ── Email ─────────────────────────────────────────────────────────────────────

  async enviarReporteEmail(
    tenantId: string,
    ownerEmail: string,
    ownerName: string,
    periodo: string,
  ): Promise<{ ok: boolean }> {
    const dias = periodo === 'mes' ? 30 : 7;
    const label = periodo === 'mes' ? 'mensual (30 días)' : 'semanal (7 días)';

    const [tendencias, metricas, tenant] = await Promise.all([
      this.dashboard.getTendencias(tenantId, dias),
      this.dashboard.getMetricas(tenantId),
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    ]);

    const storeName = tenant?.name ?? 'Tu negocio';

    const chartIngresosUrl = this.encodeChart(
      this.buildIngresosChart(tendencias, `Ingresos — ${label}`),
    );
    const chartActividadUrl = this.encodeChart(
      this.buildOrdenesChart(tendencias, `Órdenes y Citas — ${label}`),
    );

    const totalIngresos = tendencias.reduce((s, t) => s + t.ingresos, 0);
    const totalOrdenes = tendencias.reduce((s, t) => s + t.ordenes, 0);
    const totalCitas = tendencias.reduce((s, t) => s + t.citas, 0);

    const html = this.buildEmailHtml({
      ownerName,
      storeName,
      label,
      metricas,
      totalIngresos,
      totalOrdenes,
      totalCitas,
      chartIngresosUrl,
      chartActividadUrl,
    });

    await this.email.send({
      to: ownerEmail,
      subject: `📊 Reporte ${label} — ${storeName}`,
      html,
    });

    this.logger.log(`Reporte email enviado a ${ownerEmail} (tenant=${tenantId})`);
    return { ok: true };
  }

  // ── HTML template ─────────────────────────────────────────────────────────────

  private buildEmailHtml(p: {
    ownerName: string;
    storeName: string;
    label: string;
    metricas: any;
    totalIngresos: number;
    totalOrdenes: number;
    totalCitas: number;
    chartIngresosUrl: string;
    chartActividadUrl: string;
  }): string {
    const fmt = (n: number) => n.toLocaleString('es-CO');
    const fecha = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });

    const card = (title: string, value: string, color = '#6366f1') =>
      `<td style="padding:12px;text-align:center;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">${title}</div>
        <div style="font-size:24px;font-weight:700;color:${color};margin-top:4px;">${value}</div>
      </td>`;

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td>
  <table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <!-- Header -->
    <tr><td style="background:#1e1b4b;padding:28px 32px;">
      <div style="font-size:20px;font-weight:700;color:#fff;">📊 Automatiza360</div>
      <div style="font-size:13px;color:#a5b4fc;margin-top:4px;">Reporte ${p.label} · ${fecha}</div>
    </td></tr>

    <!-- Greeting -->
    <tr><td style="padding:28px 32px 16px;">
      <p style="margin:0;font-size:15px;color:#374151;">Hola <strong>${p.ownerName}</strong>, aquí está el resumen de <strong>${p.storeName}</strong> para los últimos días.</p>
    </td></tr>

    <!-- KPI cards -->
    <tr><td style="padding:0 32px 24px;">
      <table width="100%" cellspacing="8" cellpadding="0">
        <tr>
          ${card('Ingresos período', '$' + fmt(p.totalIngresos), '#6366f1')}
          ${card('Órdenes', String(p.totalOrdenes), '#8b5cf6')}
          ${card('Citas', String(p.totalCitas), '#06b6d4')}
          ${card('Tickets abiertos', String(p.metricas.ticketsAbiertos ?? 0), '#f59e0b')}
        </tr>
        <tr style="height:8px;"><td colspan="4"></td></tr>
        <tr>
          ${card('Ingresos este mes', '$' + fmt(p.metricas.ingresosMes ?? 0), '#10b981')}
          ${card('Órdenes hoy', String(p.metricas.ordenesHoy ?? 0), '#6366f1')}
          ${card('Citas hoy', String(p.metricas.citasHoy ?? 0), '#06b6d4')}
          ${card('Nuevos contactos (7d)', String(p.metricas.contactosNuevosSemana ?? 0), '#ec4899')}
        </tr>
      </table>
    </td></tr>

    <!-- Chart ingresos -->
    <tr><td style="padding:0 32px 8px;">
      <div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">📈 Evolución de ingresos</div>
      <img src="${p.chartIngresosUrl}" alt="Gráfica ingresos" width="536" style="border-radius:8px;display:block;border:1px solid #e5e7eb;">
    </td></tr>

    <!-- Chart actividad -->
    <tr><td style="padding:16px 32px 8px;">
      <div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">📊 Órdenes y citas por día</div>
      <img src="${p.chartActividadUrl}" alt="Gráfica actividad" width="536" style="border-radius:8px;display:block;border:1px solid #e5e7eb;">
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 32px;border-top:1px solid #e5e7eb;margin-top:8px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Automatiza360 · Reporte generado automáticamente<br>
        Para más detalles visita tu panel en <a href="${process.env.FRONTEND_URL ?? 'https://automatiza360.com'}" style="color:#6366f1;">automatiza360.com</a>
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
  }
}
