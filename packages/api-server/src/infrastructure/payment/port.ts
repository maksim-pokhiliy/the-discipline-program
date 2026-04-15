export type CreateCheckoutInput = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutResult = {
  url: string;
  sessionId: string;
};

export type VerifyWebhookInput = {
  payload: string;
  signature: string;
};

export type PaymentPort = {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyWebhook(input: VerifyWebhookInput): boolean;
};
