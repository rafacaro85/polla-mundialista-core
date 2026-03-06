import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import type { MercadoPagoWebhookDto } from './dto/mp-webhook.dto';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Post('create-preference')
  async createPreference(
    @Request() req: any,
    @Body() body: CreatePreferenceDto,
  ) {
    this.logger.log(`Creating MP preference for user: ${req.user.id}`);
    
    const amount = Number(body.amount);
    const currency = body.currency || 'COP';
    const packageId = body.packageId || 'SOCIAL_BASIC';
    
    if (!amount || amount <= 0) {
      throw new Error('amount es requerido');
    }

    const transaction = await this.transactionsService.createTransaction(
      req.user,
      amount,
      packageId,
      body.leagueId || null,
      TransactionStatus.PENDING,
    );

    return this.paymentsService.createPreference(
      transaction.referenceCode,
      amount,
      currency,
      transaction.id,
      packageId
    );
  }
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    this.logger.log(`MP webhook received: ${webhookData.action} - ${webhookData.type}`);
    const result = await this.paymentsService.handleMPWebhook(webhookData);
    return result;
  }
}
