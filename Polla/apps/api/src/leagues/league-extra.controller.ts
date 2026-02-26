import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueExtraService } from './league-extra.service';
import { LeaguesService } from './leagues.service';

@Controller('leagues/:leagueId/extra')
@UseGuards(JwtAuthGuard)
export class LeagueExtraController {
  constructor(
    private readonly extraService: LeagueExtraService,
    private readonly leaguesService: LeaguesService,
  ) {}

  private async checkAdmin(leagueId: string, req: any, type: 'prize' | 'banner') {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    if (isSuperAdmin) return true;

    const league: any = await this.leaguesService.getLeagueDetails(
      leagueId,
      req.user.id,
    );

    const isLeagueAdmin =
      league.creatorId === req.user.id ||
      league.participants?.some(
        (p: any) => p.userId === req.user.id && p.isAdmin,
      );

    if (!isLeagueAdmin) {
      throw new ForbiddenException(
        'You do not have permission to manage this league',
      );
    }

    const plan = (league.packageType || '').toUpperCase();
    const isEnterprise =
      league.isEnterprise || league.type === 'company' || plan === 'ENTERPRISE_LAUNCH';

    if (type === 'prize') {
      if (!isEnterprise) {
        throw new ForbiddenException(
          'Solo las pollas empresariales pueden subir imágenes de premios.',
        );
      }
    }

    if (type === 'banner') {
      // Banners are ONLY allowed for DIAMOND plans (enterprise)
      if (!isEnterprise || !plan.includes('DIAMOND')) {
        throw new ForbiddenException(
          'La subida de publicidad es una función exclusiva para planes DIAMANTE.',
        );
      }
    }
  }

  // --- PRIZES ---

  @Get('prizes')
  async getPrizes(@Param('leagueId') leagueId: string) {
    return this.extraService.getPrizes(leagueId);
  }

  @Post('prizes')
  async createPrize(
    @Param('leagueId') leagueId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'prize');
    return this.extraService.createPrize(leagueId, data);
  }

  @Put('prizes/:prizeId')
  async updatePrize(
    @Param('leagueId') leagueId: string,
    @Param('prizeId') prizeId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'prize');
    return this.extraService.updatePrize(prizeId, data);
  }

  @Delete('prizes/:prizeId')
  async deletePrize(
    @Param('leagueId') leagueId: string,
    @Param('prizeId') prizeId: string,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'prize');
    return this.extraService.deletePrize(prizeId);
  }

  @Post('prizes/reorder')
  async reorderPrizes(
    @Param('leagueId') leagueId: string,
    @Body() body: { prizeIds: string[] },
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'prize');
    return this.extraService.reorderPrizes(leagueId, body.prizeIds);
  }

  // --- BANNERS ---

  @Get('banners')
  async getBanners(@Param('leagueId') leagueId: string) {
    return this.extraService.getBanners(leagueId);
  }

  @Post('banners')
  async createBanner(
    @Param('leagueId') leagueId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'banner');
    return this.extraService.createBanner(leagueId, data);
  }

  @Put('banners/:bannerId')
  async updateBanner(
    @Param('leagueId') leagueId: string,
    @Param('bannerId') bannerId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'banner');
    return this.extraService.updateBanner(bannerId, data);
  }

  @Delete('banners/:bannerId')
  async deleteBanner(
    @Param('leagueId') leagueId: string,
    @Param('bannerId') bannerId: string,
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'banner');
    return this.extraService.deleteBanner(bannerId);
  }

  @Post('banners/reorder')
  async reorderBanners(
    @Param('leagueId') leagueId: string,
    @Body() body: { bannerIds: string[] },
    @Req() req: any,
  ) {
    await this.checkAdmin(leagueId, req, 'banner');
    return this.extraService.reorderBanners(leagueId, body.bannerIds);
  }
}
