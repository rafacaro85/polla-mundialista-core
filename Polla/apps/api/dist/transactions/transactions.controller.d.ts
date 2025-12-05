import { TransactionsService } from './transactions.service';
import { PdfService } from '../common/pdf/pdf.service';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly pdfService;
    constructor(transactionsService: TransactionsService, pdfService: PdfService);
    getAllTransactions(): Promise<import("../database/entities/transaction.entity").Transaction[]>;
    downloadVoucher(id: string, res: any): Promise<void>;
}
