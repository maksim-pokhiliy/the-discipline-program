import { monobankEnv } from "@repo/env/monobank";

import { createMonobankAdapter } from "./monobank-adapter";
import type { PaymentPort } from "./port";

export type {
  BasketLine,
  ChargeOutcome,
  ChargeStoredCardInput,
  CreatePurchaseInput,
  CreatePurchaseResult,
  PaidWith,
  PaymentPort,
  PurchaseState,
  PurchaseStatus,
  SignedWebhook,
  StoredCard,
  StoredCardStatus,
} from "./port";
export { createMonobankAdapter } from "./monobank-adapter";

export const defaultPayment: PaymentPort = createMonobankAdapter({
  apiUrl: monobankEnv.MONOBANK_API_URL,
  merchantToken: monobankEnv.MONOBANK_MERCHANT_TOKEN,
  webhookPublicKey: monobankEnv.MONOBANK_WEBHOOK_PUBLIC_KEY,
});
