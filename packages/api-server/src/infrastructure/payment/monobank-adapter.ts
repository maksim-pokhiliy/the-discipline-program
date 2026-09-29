import { createMonobankHttp, type MonobankHttp } from "./monobank-http";
import {
  checkOutgoing,
  readChargeOutcome,
  readCreatePurchaseResult,
  readPublicKeyValue,
  readPurchaseState,
} from "./monobank-parse";
import { createWebhookVerifier, type WebhookVerifier } from "./monobank-signature";
import {
  BASKET_QUANTITY,
  BASKET_UNIT,
  CCY_BY_CURRENCY,
  INITIATION_KIND_MERCHANT,
  type InvoiceCreateRequest,
  invoiceCreateRequestSchema,
  MONOBANK_PATH,
  PAYMENT_TYPE_DEBIT,
  type WalletPaymentRequest,
  walletPaymentRequestSchema,
} from "./monobank-wire";
import type {
  BasketLine,
  ChargeOutcome,
  ChargeStoredCardInput,
  CreatePurchaseInput,
  CreatePurchaseResult,
  PaymentPort,
  PurchaseState,
} from "./port";

export type MonobankAdapterConfig = {
  apiUrl: string;
  merchantToken: string;
  webhookPublicKey?: string | undefined;
  fetch?: typeof fetch | undefined;
};

type MerchantPaymInfoSource = {
  amountCents: number;
  reference: string;
  description: string;
  basketLine: BasketLine;
};

const buildMerchantPaymInfo = (
  source: MerchantPaymInfoSource,
): InvoiceCreateRequest["merchantPaymInfo"] => ({
  reference: source.reference,
  destination: source.description,
  basketOrder: [
    {
      name: source.basketLine.name,
      qty: BASKET_QUANTITY,
      sum: source.amountCents,
      total: source.amountCents,
      unit: BASKET_UNIT,
      code: source.basketLine.code,
    },
  ],
});

const buildInvoiceRequest = (input: CreatePurchaseInput): InvoiceCreateRequest => ({
  amount: input.amountCents,
  ccy: CCY_BY_CURRENCY[input.currency],
  merchantPaymInfo: buildMerchantPaymInfo(input),
  redirectUrl: input.redirectUrl,
  webHookUrl: input.webhookUrl,
  paymentType: PAYMENT_TYPE_DEBIT,
  ...(input.validitySeconds !== undefined && { validity: input.validitySeconds }),
  ...(input.storeCard !== null && {
    saveCardData: { saveCard: true, walletId: input.storeCard.walletId },
  }),
});

const buildChargeRequest = (input: ChargeStoredCardInput): WalletPaymentRequest => ({
  cardToken: input.cardToken,
  amount: input.amountCents,
  ccy: CCY_BY_CURRENCY[input.currency],
  initiationKind: INITIATION_KIND_MERCHANT,
  merchantPaymInfo: buildMerchantPaymInfo(input),
  paymentType: PAYMENT_TYPE_DEBIT,
  webHookUrl: input.webhookUrl,
});

const createVerifier = (
  webhookPublicKey: string | undefined,
  http: MonobankHttp,
): WebhookVerifier =>
  createWebhookVerifier({
    pinnedKey: webhookPublicKey || undefined,
    fetchKey: async () =>
      readPublicKeyValue(await http.send({ method: "GET", path: MONOBANK_PATH.publicKey })),
  });

export const createMonobankAdapter = (config: MonobankAdapterConfig): PaymentPort => {
  const http = createMonobankHttp({
    apiUrl: config.apiUrl,
    merchantToken: config.merchantToken,
    fetch: config.fetch,
  });
  const verifier = createVerifier(config.webhookPublicKey, http);

  const createPurchase = async (input: CreatePurchaseInput): Promise<CreatePurchaseResult> => {
    const path = MONOBANK_PATH.invoiceCreate;
    const body = checkOutgoing(invoiceCreateRequestSchema, buildInvoiceRequest(input), path);

    return readCreatePurchaseResult(await http.send({ method: "POST", path, body }));
  };

  const chargeStoredCard = async (input: ChargeStoredCardInput): Promise<ChargeOutcome> => {
    const path = MONOBANK_PATH.walletPayment;
    const body = checkOutgoing(walletPaymentRequestSchema, buildChargeRequest(input), path);
    const secrets = [input.cardToken];

    return readChargeOutcome(await http.send({ method: "POST", path, body, secrets }));
  };

  const fetchPurchase = async (providerRef: string): Promise<PurchaseState> => {
    const query = { invoiceId: providerRef };

    return readPurchaseState(
      await http.send({ method: "GET", path: MONOBANK_PATH.invoiceStatus, query }),
    );
  };

  const forgetStoredCard = async (cardToken: string): Promise<void> => {
    const query = { cardToken };
    const secrets = [cardToken];

    await http.send({ method: "DELETE", path: MONOBANK_PATH.walletCard, query, secrets });
  };

  return {
    createPurchase,
    chargeStoredCard,
    fetchPurchase,
    forgetStoredCard,
    verifyWebhook: verifier.verify,
    parseWebhook: readPurchaseState,
  };
};
