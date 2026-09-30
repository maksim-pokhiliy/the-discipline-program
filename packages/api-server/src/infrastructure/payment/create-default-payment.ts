import { createMonobankAdapter } from "./monobank-adapter";
import type { PaymentPort } from "./port";

type MonobankEnvValues = {
  MONOBANK_API_URL: string;
  MONOBANK_MERCHANT_TOKEN: string;
  MONOBANK_WEBHOOK_PUBLIC_KEY?: string | undefined;
};

export const createDefaultPayment = (env: MonobankEnvValues): PaymentPort =>
  createMonobankAdapter({
    apiUrl: env.MONOBANK_API_URL,
    merchantToken: env.MONOBANK_MERCHANT_TOKEN,
    webhookPublicKey: env.MONOBANK_WEBHOOK_PUBLIC_KEY,
  });
