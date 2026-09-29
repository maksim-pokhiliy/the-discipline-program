import type { Currency } from "@repo/contracts/common";

export type PurchaseStatus =
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "HELD"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export type StoredCardStatus = "PENDING" | "STORED" | "FAILED";

export type BasketLine = {
  name: string;
  code: string;
};

export type CreatePurchaseInput = {
  amountCents: number;
  currency: Currency;
  reference: string;
  description: string;
  basketLine: BasketLine;
  redirectUrl: string;
  webhookUrl: string;
  validitySeconds?: number | undefined;
  storeCard: { walletId: string } | null;
};

export type CreatePurchaseResult = {
  providerRef: string;
  redirectUrl: string;
};

export type ChargeStoredCardInput = {
  cardToken: string;
  amountCents: number;
  currency: Currency;
  reference: string;
  description: string;
  basketLine: BasketLine;
  webhookUrl: string;
};

export type ChargeOutcome = {
  providerRef: string;
  status: PurchaseStatus;
  challengeUrl: string | null;
  modifiedAt: Date;
};

export type StoredCard =
  | {
      status: "STORED";
      walletId: string;
      cardToken: string;
      maskedPan: string | null;
      paymentSystem: string | null;
    }
  | {
      status: "PENDING" | "FAILED";
      walletId: string;
      cardToken: string | null;
      maskedPan: string | null;
      paymentSystem: string | null;
    };

export type PaidWith = {
  maskedPan: string;
  paymentSystem: string;
};

export type PurchaseState = {
  providerRef: string;
  status: PurchaseStatus;
  amountCents: number;
  currency: Currency;
  reference: string | null;
  createdAt: Date;
  modifiedAt: Date;
  storedCard: StoredCard | null;
  paidWith: PaidWith | null;
};

export type SignedWebhook = {
  rawBody: string;
  signature: string;
};

export type PaymentPort = {
  createPurchase(input: CreatePurchaseInput): Promise<CreatePurchaseResult>;
  chargeStoredCard(input: ChargeStoredCardInput): Promise<ChargeOutcome>;
  fetchPurchase(providerRef: string): Promise<PurchaseState>;
  forgetStoredCard(cardToken: string): Promise<void>;
  verifyWebhook(webhook: SignedWebhook): Promise<boolean>;
  parseWebhook(rawBody: string): PurchaseState;
};
