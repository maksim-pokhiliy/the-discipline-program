import { z } from "zod";

import { Currency } from "@repo/contracts/common";

import type { PurchaseStatus, StoredCardStatus } from "./port";

export const MONOBANK_PATH = {
  invoiceCreate: "/api/merchant/invoice/create",
  invoiceStatus: "/api/merchant/invoice/status",
  walletPayment: "/api/merchant/wallet/payment",
  walletCard: "/api/merchant/wallet/card",
  publicKey: "/api/merchant/pubkey",
} as const;

export type MonobankPath = (typeof MONOBANK_PATH)[keyof typeof MONOBANK_PATH];

export const BASKET_QUANTITY = 1;
export const BASKET_UNIT = "шт.";
export const PAYMENT_TYPE_DEBIT = "debit";
export const INITIATION_KIND_MERCHANT = "merchant";

export const CCY_BY_CURRENCY: Record<Currency, number> = {
  [Currency.UAH]: 980,
  [Currency.USD]: 840,
  [Currency.EUR]: 978,
};

const CURRENCY_BY_CCY = new Map(
  Object.values(Currency).map((currency): [number, Currency] => [
    CCY_BY_CURRENCY[currency],
    currency,
  ]),
);

const monobankDateSchema = z.string().datetime({ offset: true }).pipe(z.coerce.date());

const invoiceStatusSchema = z.enum([
  "created",
  "processing",
  "hold",
  "success",
  "failure",
  "reversed",
  "expired",
]);

type MonobankInvoiceStatus = z.infer<typeof invoiceStatusSchema>;

const walletStatusSchema = z.enum(["new", "created", "failed"]);

type MonobankWalletStatus = z.infer<typeof walletStatusSchema>;

export const PURCHASE_STATUS_BY_INVOICE_STATUS = {
  created: "AWAITING_PAYMENT",
  processing: "PROCESSING",
  hold: "HELD",
  success: "SUCCEEDED",
  failure: "FAILED",
  reversed: "REFUNDED",
  expired: "EXPIRED",
} satisfies Record<MonobankInvoiceStatus, PurchaseStatus>;

export const STORED_CARD_STATUS_BY_WALLET_STATUS = {
  new: "PENDING",
  created: "STORED",
  failed: "FAILED",
} satisfies Record<MonobankWalletStatus, StoredCardStatus>;

const ccySchema = z
  .number()
  .int()
  .transform((ccy, context) => {
    const currency = CURRENCY_BY_CCY.get(ccy);

    if (currency === undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom });

      return z.NEVER;
    }

    return currency;
  });

const absentWhenEmpty = (value: unknown): unknown =>
  value === null || value === "" ? undefined : value;

const optionalReplyText = z.preprocess(absentWhenEmpty, z.string().optional());

const storedWalletSchema = z.object({
  status: walletStatusSchema.extract(["created"]),
  walletId: z.string(),
  cardToken: z.string().min(1),
  maskedPan: optionalReplyText,
  paymentSystem: optionalReplyText,
});

const unsettledWalletSchema = z.object({
  status: walletStatusSchema.exclude(["created"]),
  walletId: z.string(),
  cardToken: z.string().optional(),
  maskedPan: optionalReplyText,
  paymentSystem: optionalReplyText,
});

const walletDataSchema = z.discriminatedUnion("status", [
  storedWalletSchema,
  unsettledWalletSchema,
]);

const paymentInfoSchema = z.object({
  maskedPan: optionalReplyText,
  paymentSystem: optionalReplyText,
});

export const invoiceSchema = z.object({
  invoiceId: z.string().min(1),
  status: invoiceStatusSchema,
  amount: z.number().int().nonnegative(),
  ccy: ccySchema,
  createdDate: monobankDateSchema,
  modifiedDate: monobankDateSchema,
  reference: optionalReplyText,
  walletData: z.preprocess(absentWhenEmpty, walletDataSchema.optional()),
  paymentInfo: z.preprocess(absentWhenEmpty, paymentInfoSchema.optional()),
});

const basketItemSchema = z
  .object({
    name: z.string().min(1),
    qty: z.literal(BASKET_QUANTITY),
    sum: z.number().int().positive().safe(),
    total: z.number().int().positive().safe(),
    unit: z.literal(BASKET_UNIT),
    code: z.string().min(1),
  })
  .strict();

const merchantPaymInfoSchema = z
  .object({
    reference: z.string().min(1),
    destination: z.string().min(1),
    basketOrder: z.tuple([basketItemSchema]),
  })
  .strict();

export const invoiceCreateRequestSchema = z
  .object({
    amount: z.number().int().positive().safe(),
    ccy: z.number().int(),
    merchantPaymInfo: merchantPaymInfoSchema,
    redirectUrl: z.string().url(),
    webHookUrl: z.string().url(),
    validity: z.number().int().positive().optional(),
    paymentType: z.literal(PAYMENT_TYPE_DEBIT),
    saveCardData: z
      .object({ saveCard: z.literal(true), walletId: z.string().min(1) })
      .strict()
      .optional(),
  })
  .strict();

export type InvoiceCreateRequest = z.infer<typeof invoiceCreateRequestSchema>;

export const walletPaymentRequestSchema = z
  .object({
    cardToken: z.string().min(1),
    amount: z.number().int().positive().safe(),
    ccy: z.number().int(),
    initiationKind: z.literal(INITIATION_KIND_MERCHANT),
    merchantPaymInfo: merchantPaymInfoSchema,
    paymentType: z.literal(PAYMENT_TYPE_DEBIT),
    webHookUrl: z.string().url(),
  })
  .strict();

export type WalletPaymentRequest = z.infer<typeof walletPaymentRequestSchema>;

export const invoiceStatusQuerySchema = z.object({ invoiceId: z.string().min(1) }).strict();

export const walletCardQuerySchema = z.object({ cardToken: z.string().min(1) }).strict();

export const invoiceCreateReplySchema = z.object({
  invoiceId: z.string().min(1),
  pageUrl: z.string().url(),
});

export const walletPaymentReplySchema = z.object({
  invoiceId: z.string().min(1),
  status: invoiceStatusSchema,
  ccy: z.preprocess(absentWhenEmpty, ccySchema.optional()),
  modifiedDate: monobankDateSchema,
  tdsUrl: z.preprocess(absentWhenEmpty, z.string().url().optional()),
});

export const publicKeyReplySchema = z.object({
  key: z.string().min(1),
});

export const errorBodySchema = z.object({
  errCode: z.string(),
  errText: z.string(),
});
