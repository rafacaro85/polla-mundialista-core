import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
  Patch,
  Delete,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  Res,
  Put,
} from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { UpdateTieBreakerDto } from './dto/update-tie-breaker.dto';
import { TransferOwnerDto } from './dto/transfer-owner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { LeagueParticipantsService } from '../league-participants/league-participants.service';
import { GenerateAccessCodesDto } from './dto/generate-access-codes.dto';
import { JoinLeagueDto } from './dto/join-league.dto';

@UseGuards(JwtAuthGuard)
@Controller('leagues')
export class LeaguesController {
  constructor(
    private readonly leaguesService: LeaguesService,
    private readonly accessCodesService: AccessCodesService,
    private readonly leagueParticipantsService: LeagueParticipantsService,
  ) { }

  @Post()
  async createLeague(@Req() req: Request, @Body() createLeagueDto: CreateLeagueDto) {
    console.log('req.user:', req.user); // Debugging: Check the user object
    const userPayload = req.user as { id: string; userId?: string }; // Explicitly cast to expected JWT payload structure
    const userId = userPayload.userId || userPayload.id;
    if (!userId) {
      throw new InternalServerErrorException('User ID not found in request after authentication.');
    }
    return this.leaguesService.createLeague(userId, createLeagueDto);
  }

  @Get('global/ranking')
  async getGlobalRanking() {
    return this.leaguesService.getGlobalRanking();
  }

  @Get('my')
  async getMyLeagues(@Req() req: Request) {
    const userPayload = req.user as { id: string; userId?: string };
    const userId = userPayload.userId || userPayload.id;
    if (!userId) {
      throw new InternalServerErrorException('User ID not found in request after authentication.');
    }
    return this.leaguesService.getMyLeagues(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('all')
  async getAllLeagues() {
    console.log('📋 [GET /leagues/all] Listando todas las ligas...');
    return this.leaguesService.getAllLeagues();
  }

  @Get(':id')
  async getLeague(@Param('id') leagueId: string, @Req() req: Request) {
    const userPayload = req.user as { id: string; userId?: string };
    const userId = userPayload.userId || userPayload.id;
    return this.leaguesService.getLeagueForUser(leagueId, userId);
  }

  @Get(':id/metadata')
  async getLeagueMetadata(@Param('id') leagueId: string) {
    return this.leaguesService.getMetadata(leagueId);
  }

  @Get('preview/:code')
  async previewLeague(@Param('code') code: string) {
    return this.leaguesService.getLeagueByCode(code);
  }

  @Get(':id/ranking')
  async getLeagueRanking(@Param('id') leagueId: string) {
    return this.leaguesService.getLeagueRanking(leagueId);
  }

  @Get(':id/matches')
  async getLeagueMatches(@Param('id') leagueId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.leaguesService.getLeagueMatches(leagueId, userId);
  }

  @Get(':id/participants')
  async getLeagueParticipants(@Param('id') leagueId: string, @Req() req: Request) {
    const userPayload = req.user as { id: string, role?: string };
    return this.leaguesService.getParticipants(leagueId, userPayload.id, userPayload.role);
  }

  @Get(':id/voucher')
  async getLeagueVoucher(@Param('id') leagueId: string, @Res() res: any) {
    const buffer = await this.leaguesService.getLeagueVoucher(leagueId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=voucher-${leagueId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post(':id/codes')
  async generateCodes(
    @Param('id') leagueId: string,
    @Body() generateAccessCodesDto: GenerateAccessCodesDto,
    @Req() req: Request,
  ) {
    // TODO: Add role-based guard for ADMIN or MANAGER
    return this.accessCodesService.generateCodes(
      leagueId,
      generateAccessCodesDto.quantity,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/tie-breaker')
  async updateTieBreaker(
    @Param('id') leagueId: string,
    @Body() dto: UpdateTieBreakerDto,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string };
    return this.leaguesService.updateTieBreaker(leagueId, userPayload.id, dto.guess);
  }

  // --- SOCIAL WALL ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id') leagueId: string,
    @Body() data: { content: string, imageUrl?: string },
    @Req() req: Request
  ) {
    const userPayload = req.user as { id: string };
    return this.leaguesService.createComment(leagueId, userPayload.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')
  async getComments(@Param('id') leagueId: string) {
    return this.leaguesService.getComments(leagueId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/comments/:commentId/toggle-like')
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: Request
  ) {
    const userPayload = req.user as { id: string };
    return this.leaguesService.toggleCommentLike(commentId, userPayload.id);
  }

  // --- ADMIN ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateLeague(
    @Param('id') leagueId: string,
    @Body() updateLeagueDto: UpdateLeagueDto,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string; role: string };
    const userId = userPayload.id;

    console.log(`✏️ [PATCH /leagues/${leagueId}] Actualizando liga...`);
    console.log(`   Usuario: ${userId} | Rol: ${userPayload.role}`);

    return this.leaguesService.updateLeague(leagueId, userId, updateLeagueDto, userPayload.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-block')
  async toggleBlockStatus(
    @Param('id') leagueId: string,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string; role: string };
    return this.leaguesService.toggleBlockStatus(leagueId, userPayload.id, userPayload.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteLeague(@Param('id') leagueId: string, @Req() req: Request) {
    const userPayload = req.user as { id: string; userId?: string; role: string };
    const userId = userPayload.userId || userPayload.id;
    console.log(`🗑️ [DELETE /leagues/${leagueId}] Eliminando liga...`);
    console.log(`   Solicitante: ${userId} | Rol: ${userPayload.role}`);
    return this.leaguesService.deleteLeague(leagueId, userId, userPayload.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/transfer-owner')
  async transferOwner(
    @Param('id') leagueId: string,
    @Body() transferOwnerDto: TransferOwnerDto,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string; role: string };
    const userId = userPayload.id;

    console.log(`🔄 [PATCH /leagues/${leagueId}/transfer-owner] Transfiriendo propiedad...`);
    console.log(`   Solicitante: ${userId} | Rol: ${userPayload.role}`);
    console.log(`   Nuevo admin: ${transferOwnerDto.newAdminId}`);

    return this.leaguesService.transferOwner(
      leagueId,
      userId,
      transferOwnerDto.newAdminId,
      userPayload.role,
    );
  }

  // --- LEAGUE OWNER ENDPOINTS ---

  @Delete(':leagueId/participants/:userId')
  async removeParticipant(
    @Param('leagueId') leagueId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string; role: string };
    const requesterId = userPayload.id;

    console.log(`🗑️ [DELETE /leagues/${leagueId}/participants/${userId}] Expulsando participante...`);
    console.log(`   Solicitante: ${requesterId} | Rol: ${userPayload.role}`);

    return this.leagueParticipantsService.removeParticipant(
      leagueId,
      userId,
      requesterId,
      userPayload.role,
    );
  }

  @Patch(':leagueId/participants/:userId/toggle-block')
  async toggleBlockParticipant(
    @Param('leagueId') leagueId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const userPayload = req.user as { id: string; role: string };
    const requesterId = userPayload.id;

    console.log(`🔒 [PATCH /leagues/${leagueId}/participants/${userId}/toggle-block] Bloqueando/Desbloqueando participante...`);

    return this.leagueParticipantsService.toggleBlockParticipant(
      leagueId,
      userId,
      requesterId,
      userPayload.role,
    );
  }

  @Get(':id/participants/:userId/details')
  async getParticipantDetails(
    @Param('id') leagueId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any
  ) {
    return this.leaguesService.getParticipantDetails(leagueId, req.user.id, targetUserId);
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') leagueId: string) {
    return this.leaguesService.getAnalyticsSummary(leagueId);
  }

  @Get(':id/export')
  async exportLeagueData(@Param('id') leagueId: string, @Res() res: any) {
    const participants = await this.leaguesService.exportParticipants(leagueId);

    const headers = ['Nombre', 'Email', 'Departamento', 'Puntos', 'Ranking', 'Puntos Trivia'];
    const rows = participants.map(p => [
      p.user.fullName || p.user.nickname,
      p.user.email,
      p.department || 'N/A',
      p.totalPoints,
      p.currentRank || '',
      p.triviaPoints
    ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=league-export.csv`,
    });
    res.send(csvContent);
  }

  // Get league details with participants (must be at the end to avoid conflicts)
  @Get(':id')
  async getLeagueDetails(@Param('id') leagueId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.leaguesService.getLeagueDetails(leagueId, userId);
  }

  @Post('join')
  async joinLeague(@Req() req: Request, @Body() joinLeagueDto: JoinLeagueDto) {
    const userPayload = req.user as { id: string; userId?: string }; // Explicitly cast
    const userId = userPayload.userId || userPayload.id;
    if (!userId) {
      throw new InternalServerErrorException('User ID not found in request after authentication.');
    }
    return this.leagueParticipantsService.joinLeague(userId, joinLeagueDto.code, joinLeagueDto.department);
  }
}
