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

  /**
   * Crea una preferencia de pago en Mercado Pago
   * Endpoint protegido con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-preference')
  async createPreference(
    @Request() req: any,
    @Body() body: CreatePreferenceDto,
  ) {
    this.logger.log(`Creating MP preference for user: ${req.user.id}`);

    // Crear transacción en BD con estado PENDING
    const transaction = await this.transactionsService.createTransaction(
      req.user,
      body.amount,
      body.packageId || 'starter',
      body.leagueId || '',
      TransactionStatus.PENDING,
    );

    // Generar preferencia de MP
    const preferenceResult = await this.paymentsService.createPreference(
      transaction.referenceCode,
      body.amount,
      body.currency,
      transaction.id,
      body.packageId
    );

    this.logger.log(
      `MP Preference generated for transaction: ${transaction.referenceCode}`,
    );

    return preferenceResult;
  }

  /**
   * Webhook de Mercado Pago - PÚBLICO (sin autenticación)
   * Responde 200 OK inmediatamente y procesa de forma asíncrona
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    this.logger.log(`MP webhook received: ${webhookData.action} - ${webhookData.type}`);

    // Validar y procesar (responde 200 OK inmediatamente)
    const result = await this.paymentsService.handleMPWebhook(webhookData);

    return result;
  }
}
