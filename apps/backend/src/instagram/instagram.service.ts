import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  private readonly appId     = process.env.META_APP_ID ?? '';
  private readonly appSecret = process.env.META_APP_SECRET ?? '';
  private readonly backendUrl = process.env.BACKEND_URL_PUBLIC ?? process.env.FRONTEND_URL?.replace('5173', '3000') ?? '';
  private readonly frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  constructor(private readonly prisma: PrismaService) {}

  /** Returns the Meta OAuth URL to redirect the user to. */
  getConnectUrl(tenantId: string): string {
    if (!this.appId) throw new BadRequestException('META_APP_ID no configurado');
    const redirectUri = encodeURIComponent(`${this.backendUrl}/instagram/callback`);
    const scope = 'instagram_manage_messages,pages_messaging,pages_read_engagement,pages_show_list';
    const state = Buffer.from(tenantId).toString('base64');
    return (
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${this.appId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&response_type=code`
    );
  }

  /** Handles the OAuth callback: exchanges code for token and saves to tenant. */
  async handleCallback(code: string, state: string): Promise<string> {
    const tenantId = Buffer.from(state, 'base64').toString('utf8');
    const redirectUri = `${this.backendUrl}/instagram/callback`;

    // 1. Exchange code for short-lived user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${this.appId}` +
      `&client_secret=${this.appSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`,
    );
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      this.logger.error('Meta token exchange failed: %j', tokenData);
      return `${this.frontendUrl}/configuracion?instagram=error`;
    }
    const shortToken: string = tokenData.access_token;

    // 2. Exchange for long-lived user token (~60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${this.appId}` +
      `&client_secret=${this.appSecret}` +
      `&fb_exchange_token=${shortToken}`,
    );
    const longData = await longRes.json() as any;
    const longToken: string = longData.access_token ?? shortToken;

    // 3. Get the Facebook Pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`,
    );
    const pagesData = await pagesRes.json() as any;
    const pages: any[] = pagesData.data ?? [];

    if (!pages.length) {
      this.logger.warn('No Facebook Pages found for tenantId=%s', tenantId);
      return `${this.frontendUrl}/configuracion?instagram=no_pages`;
    }

    // 4. Find the first page that has an Instagram Business Account
    let chosenPage: any = null;
    let instagramPageId = '';
    let instagramPageName = '';
    let pageAccessToken = '';

    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}` +
        `?fields=instagram_business_account&access_token=${page.access_token}`,
      );
      const igData = await igRes.json() as any;
      if (igData.instagram_business_account?.id) {
        chosenPage        = page;
        instagramPageId   = igData.instagram_business_account.id;
        instagramPageName = page.name;
        pageAccessToken   = page.access_token; // Page Access Token (never expires if page is live)
        break;
      }
    }

    if (!instagramPageId) {
      return `${this.frontendUrl}/configuracion?instagram=no_instagram_account`;
    }

    // 5. Save to tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        instagramPageId,
        instagramPageName,
        metaPageAccessToken: pageAccessToken,
        instagramConnectedAt: new Date(),
      },
    });

    this.logger.log('Instagram connected: tenantId=%s pageId=%s page=%s', tenantId, instagramPageId, instagramPageName);
    return `${this.frontendUrl}/configuracion?instagram=connected`;
  }

  /** Returns the current Instagram connection status for a tenant. */
  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { instagramPageId: true, instagramPageName: true, instagramConnectedAt: true },
    });
    return {
      connected: !!tenant?.instagramPageId,
      pageId: tenant?.instagramPageId ?? null,
      pageName: tenant?.instagramPageName ?? null,
      connectedAt: tenant?.instagramConnectedAt ?? null,
    };
  }

  /** Disconnects Instagram from the tenant. */
  async disconnect(tenantId: string) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        instagramPageId: null,
        instagramPageName: null,
        metaPageAccessToken: null,
        instagramConnectedAt: null,
      },
    });
    return { disconnected: true };
  }

  /**
   * Internal endpoint called by the AI service to get the page access token
   * for a given Instagram Page ID.
   */
  async getTenantByPageId(pageId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { instagramPageId: pageId },
      select: { id: true, metaPageAccessToken: true },
    });
    if (!tenant || !tenant.metaPageAccessToken) return null;

    const owner = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'OWNER', active: true },
      select: { email: true },
    });

    return {
      tenantId: tenant.id,
      pageAccessToken: tenant.metaPageAccessToken,
      botEmail: owner?.email ?? null,
    };
  }
}
