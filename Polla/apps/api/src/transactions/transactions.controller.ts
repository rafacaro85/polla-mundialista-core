import { Controller, Get, Post, Patch, Param, Body, Res, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { PdfService } from '../common/pdf/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly pdfService: PdfService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createTransaction(@Request() req: any, @Body() body: { packageType: string, amount: number, leagueId: string }) {
        return this.transactionsService.createTransaction(
            req.user,
            body.amount,
            body.packageType,
            body.leagueId
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
    async getAllTransactions() {
        return this.transactionsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/voucher')
    async downloadVoucher(@Param('id') id: string, @Res() res: any) {
        const transaction = await this.transactionsService.findOne(id);

        if (!transaction) {
            throw new NotFoundException('Transacción no encontrada');
        }

        if (!transaction.user || !transaction.league) {
            // Should not happen if relations are loaded correctly
            throw new NotFoundException('Datos incompletos de la transacción (usuario o liga faltante)');
        }

        const buffer = await this.pdfService.generateVoucher(transaction, transaction.user, transaction.league);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=voucher-${transaction.referenceCode}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }
}
