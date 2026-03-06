import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { MercadoPagoWebhookDto } from './dto/mp-webhook.dto';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mpClient: MercadoPagoConfig;

  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private transactionsService: TransactionsService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || '',
    });
  }

  /**
   * Crea la preferencia de pago en Mercado Pago
   */
  async createPreference(
    reference: string,
    amount: number,
    currency: string,
    transactionId: string,
    packageId?: string,
  ): Promise<{ init_point: string; transactionId: string }> {
    const preference = new Preference(this.mpClient);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

    const response = await preference.create({
      body: {
        items: [
          {
            id: packageId || 'starter',
            title: `Plan ${packageId || 'Starter'} - La Polla Virtual`,
            quantity: 1,
            currency_id: currency,
            unit_price: amount,
          },
        ],
        external_reference: transactionId, // CRITICAL: Link MP external_reference directly to our DB transaction.id
        back_urls: {
          success: `${frontendUrl}/mis-pollas?payment=success`,
          failure: `${frontendUrl}/mis-pollas?payment=failure`,
          pending: `${frontendUrl}/mis-pollas?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${apiUrl}/payments/webhook`,
      },
    });

    this.logger.log(`MP Preference created for transaction: ${transactionId}`);
    
    return {
      init_point: response.init_point,
      transactionId,
    };
  }

  /**
   * Procesa el pago del webhook de Mercado Pago
   * IMPORTANTE: Este método se ejecuta de forma asíncrona después de responder 200 OK
   */
  async processPayment(paymentId: string): Promise<void> {
    this.logger.log(`Processing MP payment ID: ${paymentId}`);

    const paymentClient = new Payment(this.mpClient);
    let paymentData;
    try {
      paymentData = await paymentClient.get({ id: paymentId });
    } catch (error) {
      this.logger.error(`Failed to fetch MP payment ${paymentId}: ${error.message}`);
      return;
    }

    const transactionId = paymentData.external_reference;

    if (!transactionId) {
      this.logger.error(`No external_reference found for MP payment ${paymentId}`);
      return;
    }

    // Buscar la transacción por ID (external_reference de MP maped to our standard UUID ID)
    const dbTransaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'league'],
    });

    if (!dbTransaction) {
      this.logger.error(`Transaction not found: ${transactionId}`);
      throw new NotFoundException(`Transaction not found: ${transactionId}`);
    }

    // Verificar que no haya sido procesada previamente
    if (
      dbTransaction.status === TransactionStatus.APPROVED ||
      dbTransaction.status === TransactionStatus.PAID
    ) {
      this.logger.warn(`Transaction already processed: ${transactionId}`);
      return;
    }

    // Procesar según el estado
    if (paymentData.status === 'approved') {
      this.logger.log(`Approving transaction: ${transactionId}`);

      // Actualizar transacción (esto activará automáticamente usuario/liga)
      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.APPROVED,
        `Pago aprobado por Mercado Pago. Ref MP: ${paymentId}`,
      );

      this.logger.log(`Transaction approved successfully: ${transactionId}`);
    } else if (
      paymentData.status === 'rejected' ||
      paymentData.status === 'cancelled'
    ) {
      this.logger.warn(`Transaction rejected/cancelled: ${transactionId}`);

      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.REJECTED,
        `Pago rechazado o cancelado en Mercado Pago. Estado: ${paymentData.status}`,
      );
    }
  }

  /**
   * Maneja el webhook de Mercado Pago con respuesta rápida 200 OK
   */
  async handleMPWebhook(webhookData: MercadoPagoWebhookDto): Promise<{ received: boolean }> {
    this.logger.log(`MP Webhook received: type=${webhookData.type}, action=${webhookData.action}`);

    if (webhookData.type === 'payment' || webhookData.action === 'payment.created' || webhookData.action === 'payment.updated') {
      const paymentId = webhookData.data?.id;
      
      if (paymentId) {
        // Responder inmediatamente con 200 OK
        // El procesamiento se hará de forma asíncrona
        setImmediate(() => {
          this.processPayment(paymentId).catch((error) => {
            this.logger.error(
              `Error processing payment: ${error.message}`,
              error.stack,
            );
          });
        });
      }
    }

    return { received: true };
  }
}
