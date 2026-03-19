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
    try {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN no configurado');
      }
      this.logger.log(`MP_ACCESS_TOKEN presente: ${accessToken.substring(0, 10)}...`);
      this.logger.log(`amount: ${amount}, currency: ${currency}, transactionId: ${transactionId}`);
      
      const client = new MercadoPagoConfig({ accessToken });
      const preference = new Preference(client);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

      const response = await preference.create({
        body: {
          items: [{
            id: packageId || 'starter',
            title: `Plan ${packageId || 'Starter'} - La Polla Virtual`,
            quantity: 1,
            currency_id: currency,
            unit_price: parseFloat(amount.toString()),
          }],
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

      this.logger.log(`MP preference creada: ${response.id}`);
      return {
        init_point: response.init_point ?? '',
        transactionId,
      };
    } catch (error: any) {
      this.logger.error(`Error MP createPreference: ${error.message}`, error.stack);
      throw error;
    }
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
  async processCardPayment(
    formData: Record<string, any>,
    amount: number,
    transactionId: string,
    ipAddress: string = '0.0.0.0',
  ): Promise<{ paymentId: string; status: string }> {
    const paymentClient = new Payment(this.mpClient);
    try {
      // Construir body dinámico: spread de formData del Brick,
      // sobreescribiendo amount y external_reference con los valores confiables del backend
      const paymentBody: Record<string, any> = {
        ...formData,
        transaction_amount: amount,
        description: 'La Polla Virtual - Activación de Liga',
        external_reference: transactionId,
      };

      // Para pagos con tarjeta, installments mínimo 1
      if (formData.token) {
        paymentBody.installments = formData.installments || 1;
      }

      // IP requerida por MP para PSE y otros métodos de transferencia
      paymentBody.additional_info = {
        ...(formData.additional_info || {}),
        ip_address: ipAddress,
      };

      // callback_url requerido por MP para PSE y transferencias bancarias
      const frontendUrl = process.env.FRONTEND_URL || 'https://lapollavirtual.com';
      paymentBody.callback_url = `${frontendUrl}/payment/success?ref=${transactionId}`;

      this.logger.log(`processCardPayment body: ${JSON.stringify({
        payment_method_id: paymentBody.payment_method_id,
        transaction_amount: paymentBody.transaction_amount,
        has_token: !!formData.token,
      })}`);

      const paymentResponse = await paymentClient.create({ body: paymentBody });

      if (paymentResponse.status === 'approved') {
        await this.transactionsService.updateStatus(
          transactionId,
          TransactionStatus.APPROVED,
          `Pago aprobado. Método: ${paymentBody.payment_method_id}. ID MP: ${paymentResponse.id}`,
        );
      } else if (
        paymentResponse.status === 'rejected' ||
        paymentResponse.status === 'cancelled'
      ) {
        await this.transactionsService.updateStatus(
          transactionId,
          TransactionStatus.REJECTED,
          `Pago rechazado. Estado: ${paymentResponse.status}`,
        );
      }

      return {
        paymentId: String(paymentResponse.id),
        status: paymentResponse.status || 'unknown',
      };
    } catch (error: any) {
      this.logger.error(`Error processCardPayment: ${error.message}`, error.stack);
      throw error;
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
