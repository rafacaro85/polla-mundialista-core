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
    }): Promise<import("../database/entities/transaction.entity").Transaction>;
    approveTransaction(id: string): Promise<import("../database/entities/transaction.entity").Transaction>;
    getAllTransactions(): Promise<import("../database/entities/transaction.entity").Transaction[]>;
    downloadVoucher(id: string, res: any): Promise<void>;
}
