import {
  Injectable,
  Logger,
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

  // Plan temporal para pruebas reales de Mercado Pago
  public readonly TEST_PLAN = {
    name: 'Plan Test $1',
    price: 1,
    maxParticipants: 5,
    features: ['Solo para pruebas'],
  };
  async createPreference(
    reference: string,
    amount: number,
    currency: string,
    transactionId: string,
    packageId?: string,
  ): Promise<{ init_point: string | undefined; transactionId: string }> {
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
            unit_price: parseFloat(amount.toString()),
          },
        ],
        external_reference: transactionId,
        back_urls: {
          success: `${frontendUrl}/mis-pollas?payment=success`,
          failure: `${frontendUrl}/mis-pollas?payment=failure`,
          pending: `${frontendUrl}/mis-pollas?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${apiUrl}/payments/webhook`,
      },
    });
    return {
      init_point: response.init_point ?? '',
      transactionId,
    };
  }
  async processPayment(paymentId: string): Promise<void> {
    const paymentClient = new Payment(this.mpClient);
    let paymentData;
    try {
      paymentData = await paymentClient.get({ id: paymentId });
    } catch (error) {
      this.logger.error(`Failed to fetch MP payment ${paymentId}: ${error.message}`);
      return;
    }
    const transactionId = paymentData.external_reference;
    if (!transactionId) return;
    const dbTransaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'league'],
    });
    if (!dbTransaction) return;
    if (
      dbTransaction.status === TransactionStatus.APPROVED ||
      dbTransaction.status === TransactionStatus.PAID
    ) return;
    if (paymentData.status === 'approved') {
      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.APPROVED,
        `Pago aprobado por Mercado Pago. Ref MP: ${paymentId}`,
      );
    } else if (
      paymentData.status === 'rejected' ||
      paymentData.status === 'cancelled'
    ) {
      await this.transactionsService.updateStatus(
        dbTransaction.id,
        TransactionStatus.REJECTED,
        `Pago rechazado. Estado: ${paymentData.status}`,
      );
    }
  }
  async handleMPWebhook(
    webhookData: MercadoPagoWebhookDto
  ): Promise<{ received: boolean }> {
    if (
      webhookData.type === 'payment' || 
      webhookData.action === 'payment.created' || 
      webhookData.action === 'payment.updated'
    ) {
      const paymentId = webhookData.data?.id;
      if (paymentId) {
        setImmediate(() => {
          this.processPayment(paymentId).catch((error) => {
            this.logger.error(`Error processing payment: ${error.message}`);
          });
        });
      }
    }
    return { received: true };
  }
}
