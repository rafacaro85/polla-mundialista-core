import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { PdfService } from '../common/pdf/pdf.service';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly pdfService: PdfService,
    ) { }

    @Get()
    async getAllTransactions() {
        return this.transactionsService.findAll();
    }

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
