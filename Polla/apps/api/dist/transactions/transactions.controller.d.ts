import { TransactionsService } from './transactions.service';
import { PdfService } from '../common/pdf/pdf.service';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly pdfService;
    constructor(transactionsService: TransactionsService, pdfService: PdfService);
    createTransaction(req: any, body: {
        packageType: string;
        amount: number;
        leagueId: string;
    }): unknown;
    approveTransaction(id: string): unknown;
    getAllTransactions(): unknown;
    downloadVoucher(id: string, res: any): any;
}
