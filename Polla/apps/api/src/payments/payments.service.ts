import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Transaction } from '../database/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { WompiWebhookDto } from './dto/wompi-webhook.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private transactionsService: TransactionsService,
  ) {}

  /**
   * Genera la firma de integridad para Wompi
   */
  generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const concatenatedString = `${reference}${amountInCents}${currency}${this.integritySecret}`;

    const signature = createHash('sha256')
      .update(concatenatedString)
      .digest('hex');

    this.logger.log(`Signature generated for reference: ${reference}`);
    return signature;
  }

  /**
   * Valida la firma del webhook de Wompi
   */
  validateWompiSignature(webhookData: WompiWebhookDto): boolean {
    const { data } = webhookData;
    const { transaction, signature } = data;

    // Construir la cadena según la documentación de Wompi
    // Formato: {transaction.id}{transaction.status}{transaction.amount_in_cents}{INTEGRITY_SECRET}
    const concatenatedString = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${this.integritySecret}`;

    const expectedSignature = createHash('sha256')
      .update(concatenatedString)
      .digest('hex');

    const isValid = expectedSignature === signature.checksum;

    if (!isValid) {
      this.logger.error(`Invalid signature for transaction ${transaction.id}`);
      this.logger.debug(`Expected: ${expectedSignature}`);
      this.logger.debug(`Received: ${signature.checksum}`);
    }

    return isValid;
  }

  /**
   * Procesa el pago del webhook de Wompi
   * IMPORTANTE: Este método se ejecuta de forma asíncrona después de responder 200 OK
   */
  async processPayment(webhookData: WompiWebhookDto): Promise<void> {
    const { transaction } = webhookData.data;

    this.logger.log(
      `Processing payment for reference: ${transaction.reference}`,
    );

    // Buscar la transacción por referenceCode
    const dbTransaction = await this.transactionsRepository.findOne({
      where: { referenceCode: transaction.reference },
      relations: ['user', 'league'],
    });

    if (!dbTransaction) {
      this.logger.error(`Transaction not found: ${transaction.reference}`);
      throw new NotFoundException(
        `Transaction not found: ${transaction.reference}`,
      );
    }

    // Verificar que no haya sido procesada previamente
    if (
      dbTransaction.status === TransactionStatus.APPROVED ||
      dbTransaction.status === TransactionStatus.PAID
    ) {
      this.logger.warn(
        `Transaction already processed: ${transaction.reference}`,
      );
      return;
    }

    // Verificar el monto
    const expectedAmountInCents = Math.round(
      Number(dbTransaction.amount) * 100,
    );
    if (transaction.amount_in_cents !== expectedAmountInCents) {
      this.logger.error(
        `Amount mismatch for ${transaction.reference}. Expected: ${expectedAmountInCents}, Received: ${transaction.amount_in_cents}`,
      );
      throw new UnauthorizedException('Amount mismatch');
    }

    // Procesar según el estado
    if (transaction.status === 'APPROVED') {
      this.logger.log(`Approving transaction: ${transaction.reference}`);

      // Actualizar transacción (esto activará automáticamente usuario/liga)
      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.APPROVED,
        `Pago aprobado por Wompi. ID: ${transaction.id}`,
      );

      this.logger.log(
        `Transaction approved successfully: ${transaction.reference}`,
      );
    } else if (
      transaction.status === 'DECLINED' ||
      transaction.status === 'ERROR'
    ) {
      this.logger.warn(`Transaction declined/error: ${transaction.reference}`);

      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.REJECTED,
        `Pago rechazado por Wompi. Estado: ${transaction.status}`,
      );
    }
  }

  /**
   * Maneja el webhook de Wompi con respuesta rápida 200 OK
   */
  async handleWebhook(
    webhookData: WompiWebhookDto,
  ): Promise<{ received: boolean }> {
    this.logger.log(`Webhook received: ${webhookData.event}`);

    // Validar firma ANTES de responder
    if (!this.validateWompiSignature(webhookData)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Responder inmediatamente con 200 OK
    // El procesamiento se hará de forma asíncrona
    setImmediate(() => {
      this.processPayment(webhookData).catch((error) => {
        this.logger.error(
          `Error processing payment: ${error.message}`,
          error.stack,
        );
      });
    });

    return { received: true };
  }
}
