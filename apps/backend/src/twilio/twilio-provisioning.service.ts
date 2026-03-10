import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProvisionResult {
  twilioNumber: string | null;
  sandboxMode: boolean;
  sandboxWord?: string;
  setupInstructions: string;
}

@Injectable()
export class TwilioProvisioningService {
  private readonly logger = new Logger(TwilioProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provisionNumber(
    tenantId: string,
    slug: string,
    botEmail: string,
    botPassword: string,
  ): Promise<ProvisionResult> {
    const env = process.env.TWILIO_ENV ?? 'sandbox';

    if (env !== 'production') {
      return this.sandboxResult(tenantId, botEmail, botPassword);
    }

    return this.provisionProduction(tenantId, slug, botEmail, botPassword);
  }

  private sandboxResult(
    tenantId: string,
    botEmail: string,
    botPassword: string,
  ): ProvisionResult {
    const sandboxWord = process.env.TWILIO_SANDBOX_WORD ?? 'automatiza360';
    const sandboxNumber = process.env.TWILIO_SANDBOX_NUMBER ?? '+14155238886';

    this.updateRailwayConfig(tenantId, botEmail, botPassword, null).catch((e) =>
      this.logger.warn('No se pudo actualizar Railway TENANT_CONFIG:', e),
    );

    return {
      twilioNumber: null,
      sandboxMode: true,
      sandboxWord,
      setupInstructions: `Envía "join ${sandboxWord}" al ${sandboxNumber} desde tu WhatsApp para activar el bot.`,
    };
  }

  private async provisionProduction(
    tenantId: string,
    slug: string,
    botEmail: string,
    botPassword: string,
  ): Promise<ProvisionResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? '';

    if (!sid || !token) {
      this.logger.warn('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN no configurados');
      return {
        twilioNumber: null,
        sandboxMode: false,
        setupInstructions: 'Twilio no está configurado. Contacta al administrador.',
      };
    }

    try {
      const credentials = Buffer.from(`${sid}:${token}`).toString('base64');
      const body = new URLSearchParams({
        AreaCode: '1',
        SmsMethod: 'POST',
        SmsUrl: `${aiServiceUrl}/webhook`,
        FriendlyName: `automatiza360-${slug}`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Error comprando número Twilio:', errorText);
        return {
          twilioNumber: null,
          sandboxMode: false,
          setupInstructions: 'Error al provisionar número. Contacta al administrador.',
        };
      }

      const data = (await response.json()) as { phone_number: string };
      const phoneNumber = data.phone_number;

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { twilioNumber: phoneNumber },
      });

      await this.updateRailwayConfig(tenantId, botEmail, botPassword, phoneNumber).catch((e) =>
        this.logger.warn('No se pudo actualizar Railway TENANT_CONFIG:', e),
      );

      return {
        twilioNumber: phoneNumber,
        sandboxMode: false,
        setupInstructions: `Tu número de WhatsApp empresarial es: ${phoneNumber}`,
      };
    } catch (error) {
      this.logger.error('Error en provisionProduction:', error);
      return {
        twilioNumber: null,
        sandboxMode: false,
        setupInstructions: 'Error al provisionar número. Contacta al administrador.',
      };
    }
  }

  private async updateRailwayConfig(
    _tenantId: string,
    _botEmail: string,
    _botPassword: string,
    _phoneNumber: string | null,
  ): Promise<void> {
    const railwayToken = process.env.RAILWAY_TOKEN;
    if (!railwayToken) return;
    // Railway API integration for automatic TENANT_CONFIG update
    // Requires RAILWAY_TOKEN and RAILWAY_SERVICE_ID env vars
    this.logger.log('Railway TENANT_CONFIG update: implement with Railway API if needed');
  }
}
