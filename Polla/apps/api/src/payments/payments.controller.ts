import { Controller, Post, Body, UseGuards, Request, Logger, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import type { WompiWebhookDto } from './dto/wompi-webhook.dto';
import { TransactionStatus } from '../database/enums/transaction-status.enum';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  /**
   * Genera la firma de integridad para iniciar un pago con Wompi
   * Endpoint protegido con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Post('signature')
  async generateSignature(@Request() req: any, @Body() body: CreateSignatureDto) {
    this.logger.log(`Generating signature for user: ${req.user.id}`);

    // Convertir monto a centavos
    const amountInCents = Math.round(body.amount * 100);

    // Crear transacción en BD con estado PENDING
    const transaction = await this.transactionsService.createTransaction(
      req.user,
      body.amount,
      body.packageId || 'starter',
      body.leagueId || '',
      TransactionStatus.PENDING,
    );

    // Generar firma de integridad
    const integritySignature = this.paymentsService.generateSignature(
      transaction.referenceCode,
      amountInCents,
      body.currency,
    );

    this.logger.log(`Signature generated for transaction: ${transaction.referenceCode}`);

    return {
      reference: transaction.referenceCode,
      amountInCents,
      currency: body.currency,
      integritySignature,
      transactionId: transaction.id,
    };
  }

  /**
   * Webhook de Wompi - PÚBLICO (sin autenticación)
   * Responde 200 OK inmediatamente y procesa de forma asíncrona
   */
  @Public()
  @Post('wompi-webhook')
  @HttpCode(200)
  async handleWompiWebhook(@Body() webhookData: WompiWebhookDto) {
    this.logger.log(`Wompi webhook received: ${webhookData.event}`);
    this.logger.debug(`Transaction ID: ${webhookData.data.transaction.id}`);
    this.logger.debug(`Reference: ${webhookData.data.transaction.reference}`);
    this.logger.debug(`Status: ${webhookData.data.transaction.status}`);

    // Validar y procesar (responde 200 OK inmediatamente)
    const result = await this.paymentsService.handleWebhook(webhookData);

    return result;
  }
}
