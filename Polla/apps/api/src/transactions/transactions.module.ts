import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../database/entities/transaction.entity';

import { TransactionsController } from './transactions.controller';
import { PdfModule } from '../common/pdf/pdf.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction]),
        PdfModule,
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService],
    exports: [TransactionsService],
})
export class TransactionsModule { }
