import { monobankEnv } from "@repo/env/monobank";

import { createDefaultPayment } from "./create-default-payment";
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

export const defaultPayment: PaymentPort = createDefaultPayment(monobankEnv);
