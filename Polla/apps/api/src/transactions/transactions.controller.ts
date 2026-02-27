import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Res,
  NotFoundException,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { DEFAULT_TOURNAMENT_ID } from '../common/constants/tournament.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { PdfService } from '../common/pdf/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { CloudinaryService } from '../upload/cloudinary.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly pdfService: PdfService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTransaction(
    @Request() req: any,
    @Body()
    body: {
      packageType: string;
      amount: number;
      leagueId: string;
      tournamentId?: string;
    },
    @Query('tournamentId') queryTournamentId?: string,
  ) {
    const tid = body.tournamentId || queryTournamentId || DEFAULT_TOURNAMENT_ID;
    return this.transactionsService.createTransaction(
      req.user,
      body.amount,
      body.packageType,
      body.leagueId,
      tid,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-latest')
  async getMyLatestTransaction(
    @Request() req: any,
    @Query('scope') scope?: string,
    @Query('leagueId') leagueId?: string,
  ) {
    if (scope === 'account') {
      return this.transactionsService.findLatestAccountTransaction(req.user.id);
    }
    if (leagueId) {
      return this.transactionsService.findLatestLeagueTransaction(
        req.user.id,
        leagueId,
      );
    }
    return this.transactionsService.findByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTransaction(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      amount?: any;
      referenceCode?: string;
      leagueId?: string;
      tournamentId?: string;
    },
    @Query('tournamentId') queryTournamentId?: string,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      // Handle potential arrays if params are duplicated in query and body
      const getFirst = (val: any) => (Array.isArray(val) ? val[0] : val);

      let rawTid = body.tournamentId || queryTournamentId || DEFAULT_TOURNAMENT_ID;
      rawTid = getFirst(rawTid);
      if (rawTid === 'undefined' || rawTid === 'null' || !rawTid) {
        rawTid = DEFAULT_TOURNAMENT_ID;
      }
      const tid = rawTid;

      // Defensive check for amount
      let amount = 50000;
      const rawAmount = getFirst(body.amount);
      if (rawAmount) {
        amount = Number(rawAmount);
        if (isNaN(amount)) {
          throw new BadRequestException('Monto de transacción inválido');
        }
      }

      // Defensive check for leagueId (ensure it's a UUID if provided)
      let leagueId = getFirst(body.leagueId);
      if (
        leagueId &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          leagueId,
        )
      ) {
        console.warn(
          `[Transactions] Invalid leagueId received: ${leagueId}, ignoring.`,
        );
        leagueId = undefined;
      }

      const referenceCode = getFirst(body.referenceCode);

      console.log(
        `[Transactions] Uploading for tournament: ${tid}, league: ${leagueId}, amount: ${amount}`,
      );

      const uploadResult = await this.cloudinaryService.uploadImage(file);

      return await this.transactionsService.uploadTransaction(
        req.user,
        uploadResult.secure_url,
        amount,
        referenceCode,
        leagueId,
        tid,
      );
    } catch (error: any) {
      console.error('[Transactions] Error in uploadTransaction:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Error uploading transaction',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TransactionStatus; adminNotes?: string },
  ) {
    return this.transactionsService.updateStatus(
      id,
      body.status,
      body.adminNotes,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id/approve')
  async approveTransaction(@Param('id') id: string) {
    return this.transactionsService.approveTransaction(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get()
  async getAllTransactions(@Query('tournamentId') tournamentId?: string) {
    return this.transactionsService.findAll(tournamentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('pending')
  async getPendingTransactions(@Query('tournamentId') tournamentId?: string) {
    return this.transactionsService.findPending(tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/voucher')
  async downloadVoucher(@Param('id') id: string, @Res() res: any) {
    const transaction = await this.transactionsService.findOne(id);

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (!transaction.user && !transaction.league) {
      // It's possible for a transaction to only have USER (account activation) or USER+LEAGUE (league payment).
      // But for generating a voucher, we might need league info?
      // If it's just account activation, maybe skip voucher or generate a generic one?
      // For now, let's allow it if user exists.
      if (!transaction.user) {
        throw new NotFoundException(
          'Datos de usuario de la transacción faltantes',
        );
      }
    }

    // If it's a generic payment, maybe the current pdfService only supports League vouchers.
    // I will guard against null league if needed inside pdfService, or here.
    // For now, keeping legacy check logic if PdfService requires league.
    if (!transaction.league && !transaction.user.hasPaid) {
      // If this logic was specific to leagues, we might need adjustment.
    }

    const buffer = await this.pdfService.generateVoucher(
      transaction,
      transaction.user,
      transaction.league,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=voucher-${transaction.referenceCode}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
