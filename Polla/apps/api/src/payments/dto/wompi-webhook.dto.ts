export interface WompiWebhookDto {
  event: string;
  data: {
    transaction: {
      id: string;
      reference: string;
      status: string;
      amount_in_cents: number;
      currency: string;
      customer_email?: string;
      payment_method_type?: string;
      payment_method?: any;
      created_at?: string;
      finalized_at?: string;
    };
    signature: {
      checksum: string;
      properties: string[];
    };
  };
  sent_at: string;
  timestamp: number;
}
