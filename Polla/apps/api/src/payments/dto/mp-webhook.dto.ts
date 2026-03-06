export class MercadoPagoWebhookDto {
  type: string;
  action: string;
  data?: { id: string };
}
