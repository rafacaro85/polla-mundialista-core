import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { League } from '../../database/entities/league.entity';
export declare class PdfService {
    private readonly logger;
    generateVoucher(transaction: Transaction, user: User, league: League): Promise<Buffer>;
    private getPackageName;
    private formatCurrency;
    private getVoucherTemplate;
}
