import { type z } from "zod";

import { type AppError, BadGatewayError, InternalServerError } from "@repo/errors";

import {
  invoiceCreateReplySchema,
  invoiceSchema,
  type MonobankPath,
  PURCHASE_STATUS_BY_INVOICE_STATUS,
  publicKeyReplySchema,
  STORED_CARD_STATUS_BY_WALLET_STATUS,
  walletPaymentReplySchema,
} from "./monobank-wire";
import type {
  ChargeOutcome,
  CreatePurchaseResult,
  PaidWith,
  PurchaseState,
  StoredCard,
} from "./port";

const OUTGOING_INVALID_MESSAGE = "monobank request is invalid";
const UNREADABLE_INVOICE_MESSAGE = "monobank sent an invoice we cannot read";
const UNREADABLE_INVOICE_REPLY_MESSAGE = "monobank sent an invoice reply we cannot read";
const UNREADABLE_CHARGE_REPLY_MESSAGE = "monobank sent a charge reply we cannot read";

export const UNREADABLE_WEBHOOK_KEY_MESSAGE = "monobank sent a webhook key we cannot read";

const INVALID_JSON_CODE = "invalid_json";
const ROOT_PATH = "";
const ISSUE_PATH_SEPARATOR = ".";

type WireIssue = {
  path: string;
  code: string;
};

type MonobankInvoice = z.output<typeof invoiceSchema>;
type MonobankWalletData = NonNullable<MonobankInvoice["walletData"]>;
type MonobankPaymentInfo = MonobankInvoice["paymentInfo"];

const toIssues = (error: z.ZodError): WireIssue[] =>
  error.issues.map((issue) => ({ path: issue.path.join(ISSUE_PATH_SEPARATOR), code: issue.code }));

const parseWith = <S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  toError: (issues: WireIssue[]) => AppError,
): z.output<S> => {
  const parsed: z.SafeParseReturnType<z.input<S>, z.output<S>> = schema.safeParse(value);

  if (!parsed.success) {
    throw toError(toIssues(parsed.error));
  }

  return parsed.data;
};

const parseJson = (text: string, message: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new BadGatewayError(message, { issues: [{ path: ROOT_PATH, code: INVALID_JSON_CODE }] });
  }
};

const readWire = <S extends z.ZodTypeAny>(schema: S, text: string, message: string): z.output<S> =>
  parseWith(schema, parseJson(text, message), (issues) => new BadGatewayError(message, { issues }));

const toStoredCard = (wallet: MonobankWalletData): StoredCard => {
  const shared = {
    walletId: wallet.walletId,
    maskedPan: wallet.maskedPan ?? null,
    paymentSystem: wallet.paymentSystem ?? null,
  };

  if (wallet.status === "created") {
    return {
      ...shared,
      status: STORED_CARD_STATUS_BY_WALLET_STATUS[wallet.status],
      cardToken: wallet.cardToken,
    };
  }

  return {
    ...shared,
    status: STORED_CARD_STATUS_BY_WALLET_STATUS[wallet.status],
    cardToken: wallet.cardToken ?? null,
  };
};

const toPaidWith = (info: MonobankPaymentInfo): PaidWith | null => {
  if (info?.maskedPan === undefined || info.paymentSystem === undefined) {
    return null;
  }

  return { maskedPan: info.maskedPan, paymentSystem: info.paymentSystem };
};

const toPurchaseState = (invoice: MonobankInvoice): PurchaseState => ({
  providerRef: invoice.invoiceId,
  status: PURCHASE_STATUS_BY_INVOICE_STATUS[invoice.status],
  amountCents: invoice.amount,
  currency: invoice.ccy,
  reference: invoice.reference ?? null,
  createdAt: invoice.createdDate,
  modifiedAt: invoice.modifiedDate,
  storedCard: invoice.walletData === undefined ? null : toStoredCard(invoice.walletData),
  paidWith: toPaidWith(invoice.paymentInfo),
});

export const readPurchaseState = (text: string): PurchaseState =>
  toPurchaseState(readWire(invoiceSchema, text, UNREADABLE_INVOICE_MESSAGE));

export const readChargeOutcome = (text: string): ChargeOutcome => {
  const reply = readWire(walletPaymentReplySchema, text, UNREADABLE_CHARGE_REPLY_MESSAGE);

  return {
    providerRef: reply.invoiceId,
    status: PURCHASE_STATUS_BY_INVOICE_STATUS[reply.status],
    amountCents: reply.amount ?? null,
    currency: reply.ccy ?? null,
    challengeUrl: reply.tdsUrl ?? null,
    modifiedAt: reply.modifiedDate,
  };
};

export const readCreatePurchaseResult = (text: string): CreatePurchaseResult => {
  const reply = readWire(invoiceCreateReplySchema, text, UNREADABLE_INVOICE_REPLY_MESSAGE);

  return { providerRef: reply.invoiceId, redirectUrl: reply.pageUrl };
};

export const readPublicKeyValue = (text: string): string =>
  readWire(publicKeyReplySchema, text, UNREADABLE_WEBHOOK_KEY_MESSAGE).key;

export const checkOutgoing = <S extends z.ZodTypeAny>(
  schema: S,
  body: z.input<S>,
  path: MonobankPath,
): z.output<S> =>
  parseWith(
    schema,
    body,
    (issues) => new InternalServerError(OUTGOING_INVALID_MESSAGE, { path, issues }),
  );
