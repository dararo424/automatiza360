import { Controller, Delete, Get, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InstagramService } from './instagram.service';

@ApiTags('instagram')
@Controller('instagram')
export class InstagramController {
  constructor(private readonly svc: InstagramService) {}

  /** Returns the Meta OAuth URL — frontend redirects the user there. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connect-url')
  getConnectUrl(@CurrentUser() user: { tenantId: string }) {
    return { url: this.svc.getConnectUrl(user.tenantId) };
  }

  /** Meta redirects here after the user authorizes the app. */
  @Get('callback')
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error || !code || !state) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      return { url: `${frontendUrl}/configuracion?instagram=cancelled` };
    }
    const redirectUrl = await this.svc.handleCallback(code, state);
    return { url: redirectUrl };
  }

  /** Returns the current Instagram connection status. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@CurrentUser() user: { tenantId: string }) {
    return this.svc.getStatus(user.tenantId);
  }

  /** Disconnects Instagram. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  disconnect(@CurrentUser() user: { tenantId: string }) {
    return this.svc.disconnect(user.tenantId);
  }

  /**
   * Internal endpoint for the AI service — returns the page access token
   * for a given Instagram Page ID (protected by INTERNAL_API_KEY).
   */
  @Get('tenant-by-page')
  async getTenantByPage(@Query('pageId') pageId: string, @Req() req: any) {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected || req.headers['x-internal-key'] !== expected) {
      return null;
    }
    return this.svc.getTenantByPageId(pageId);
  }
}
