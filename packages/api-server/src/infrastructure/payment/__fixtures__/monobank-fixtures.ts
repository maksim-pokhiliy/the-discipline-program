import { createSign, generateKeyPairSync, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Mock } from "vitest";
import { z } from "zod";

import { Currency } from "@repo/contracts/common";
import { AppError } from "@repo/errors";

import type { MonobankAdapterConfig } from "../monobank-adapter";
import type { ChargeStoredCardInput, CreatePurchaseInput, SignedWebhook } from "../port";

export const TEST_API_URL = "https://api.monobank.test";
export const TEST_MERCHANT_TOKEN = "test-merchant-token-0001";
export const SYNTHETIC_CARD_TOKEN = "synthetic-card-token-01";
export const SYNTHETIC_WALLET_ID = "clz00000000000000000usr1";
export const SYNTHETIC_INVOICE_ID = "synthetic-invoice-0001";
export const SYNTHETIC_REFERENCE = "clz00000000000000000pur1";
export const SYNTHETIC_DESCRIPTION = "Discipline program, 4 weeks";
export const SYNTHETIC_AMOUNT_CENTS = 4_900;
export const SYNTHETIC_INVOICE_DATE = "2026-09-25T10:55:41Z";

const SYNTHETIC_PRODUCT_NAME = "Discipline program";
const SYNTHETIC_PRODUCT_CODE = "clz00000000000000000prd1";
const SYNTHETIC_RETURN_URL = "https://platform.example.test/billing/return";
const SYNTHETIC_WEBHOOK_URL = "https://platform.example.test/api/billing/monobank/webhook";
const UAH_CCY = 980;

const FIXTURES_DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC_KEY_FIXTURE = "monobank-test-pubkey.json";
const SIGNING_CURVE = "prime256v1";
const SIGNATURE_ALGORITHM = "SHA256";
const JSON_HEADERS = { "content-type": "application/json" };

export type WebhookCaptureName = "created" | "processing" | "success";

export type SigningKeyPair = {
  privateKey: KeyObject;
  publicKey: KeyObject;
};

export type RecordedRequest = {
  url: string;
  init: RequestInit;
  headers: Record<string, string>;
  body: string | undefined;
  json: unknown;
};

const webhookCaptureSchema = z.object({
  rawBody: z.string(),
  headers: z.object({ "x-sign": z.string() }),
  verified: z.literal(true),
});

const publicKeyFixtureSchema = z.object({
  key: z.string().min(1),
});

const readJsonFixture = (fileName: string): unknown =>
  JSON.parse(readFileSync(join(FIXTURES_DIR, fileName), "utf8"));

export const readWebhookCapture = (name: WebhookCaptureName): SignedWebhook => {
  const capture = webhookCaptureSchema.parse(readJsonFixture(`webhook-invoice-${name}.json`));

  return { rawBody: capture.rawBody, signature: capture.headers["x-sign"] };
};

export const readTestPublicKeyValue = (): string =>
  publicKeyFixtureSchema.parse(readJsonFixture(PUBLIC_KEY_FIXTURE)).key;

export const makeAdapterConfig = (
  overrides: Partial<MonobankAdapterConfig> = {},
): MonobankAdapterConfig => ({
  apiUrl: TEST_API_URL,
  merchantToken: TEST_MERCHANT_TOKEN,
  webhookPublicKey: readTestPublicKeyValue(),
  ...overrides,
});

export const makePurchaseInput = (
  overrides: Partial<CreatePurchaseInput> = {},
): CreatePurchaseInput => ({
  amountCents: SYNTHETIC_AMOUNT_CENTS,
  currency: Currency.UAH,
  reference: SYNTHETIC_REFERENCE,
  description: SYNTHETIC_DESCRIPTION,
  basketLine: { name: SYNTHETIC_PRODUCT_NAME, code: SYNTHETIC_PRODUCT_CODE },
  redirectUrl: SYNTHETIC_RETURN_URL,
  webhookUrl: SYNTHETIC_WEBHOOK_URL,
  storeCard: null,
  ...overrides,
});

export const makeChargeInput = (
  overrides: Partial<ChargeStoredCardInput> = {},
): ChargeStoredCardInput => ({
  cardToken: SYNTHETIC_CARD_TOKEN,
  amountCents: SYNTHETIC_AMOUNT_CENTS,
  currency: Currency.UAH,
  reference: SYNTHETIC_REFERENCE,
  description: SYNTHETIC_DESCRIPTION,
  basketLine: { name: SYNTHETIC_PRODUCT_NAME, code: SYNTHETIC_PRODUCT_CODE },
  webhookUrl: SYNTHETIC_WEBHOOK_URL,
  ...overrides,
});

export const makeInvoiceBody = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  invoiceId: SYNTHETIC_INVOICE_ID,
  status: "created",
  amount: SYNTHETIC_AMOUNT_CENTS,
  ccy: UAH_CCY,
  createdDate: SYNTHETIC_INVOICE_DATE,
  modifiedDate: SYNTHETIC_INVOICE_DATE,
  reference: SYNTHETIC_REFERENCE,
  destination: SYNTHETIC_DESCRIPTION,
  ...overrides,
});

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

export const textResponse = (status: number, text: string): Response =>
  new Response(text, { status });

export const emptyResponse = (status: number): Response => new Response(null, { status });

export const generateSigningKey = (): SigningKeyPair =>
  generateKeyPairSync("ec", { namedCurve: SIGNING_CURVE });

export const signBody = (privateKey: KeyObject, rawBody: string): string =>
  createSign(SIGNATURE_ALGORITHM).update(rawBody, "utf8").sign(privateKey).toString("base64");

export const publicKeyValueOf = (publicKey: KeyObject): string =>
  Buffer.from(String(publicKey.export({ type: "spki", format: "pem" })), "utf8").toString("base64");

const parseRecordedBody = (body: string | undefined): unknown =>
  body === undefined ? undefined : JSON.parse(body);

export const requestOf = (fetchMock: Mock<typeof fetch>, index: number): RecordedRequest => {
  const call = fetchMock.mock.calls[index];

  if (call === undefined) {
    throw new Error(`fetch was called fewer than ${index + 1} times`);
  }

  const [input, init] = call;

  if (typeof input !== "string" || init === undefined) {
    throw new Error("expected fetch to be called with a URL string and an init object");
  }

  const { headers, body } = init;

  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    throw new Error("expected a plain record of headers");
  }

  if (body !== undefined && typeof body !== "string") {
    throw new Error("expected a string body or none");
  }

  return { url: input, init, headers, body, json: parseRecordedBody(body) };
};

export const captureAppError = async (pending: Promise<unknown>): Promise<AppError> => {
  const outcome = await pending.then(
    () => null,
    (error: unknown) => error,
  );

  if (!(outcome instanceof AppError)) {
    throw new Error("expected the call to reject with an AppError");
  }

  return outcome;
};

export const captureThrownAppError = (run: () => unknown): AppError => {
  try {
    run();
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }

    throw error;
  }

  throw new Error("expected the call to throw an AppError");
};
