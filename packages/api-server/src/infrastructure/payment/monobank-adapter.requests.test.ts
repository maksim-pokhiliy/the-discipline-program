import { beforeEach, describe, expect, it, vi } from "vitest";

import { Currency } from "@repo/contracts/common";
import { InternalServerError } from "@repo/errors";

import {
  captureAppError,
  emptyResponse,
  jsonResponse,
  makeAdapterConfig,
  makeChargeInput,
  makeInvoiceBody,
  makePurchaseInput,
  requestOf,
  SYNTHETIC_AMOUNT_CENTS,
  SYNTHETIC_CARD_TOKEN,
  SYNTHETIC_INVOICE_ID,
  SYNTHETIC_WALLET_ID,
  TEST_API_URL,
  TEST_MERCHANT_TOKEN,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { BasketLine, ChargeStoredCardInput, CreatePurchaseInput, PaymentPort } from "./port";

const UAH_CCY = 980;
const USD_CCY = 840;
const EUR_CCY = 978;
const BASKET_QUANTITY = 1;
const BASKET_UNIT = "шт.";
const PAYMENT_TYPE_DEBIT = "debit";
const INITIATION_KIND_MERCHANT = "merchant";
const VALIDITY_SECONDS = 3_600;
const FRACTIONAL_AMOUNT = 4_900.5;
const OK_STATUS = 200;
const NO_CONTENT_STATUS = 204;
const JSON_CONTENT_TYPE = "application/json";
const OFFSET_TIMESTAMP = "2026-09-25T14:23:28.764528+03:00";
const OFFSET_TIMESTAMP_AS_DATE = new Date("2026-09-25T11:23:28.764Z");
const PAGE_URL = "https://pay.monobank.test/synthetic-invoice-0001";
const CHALLENGE_URL = "https://pay.monobank.test/fake-tds/synthetic-invoice-0001";
const RESERVED_CHARACTER_CARD_TOKEN = "a+b/c=";
const TOKENIZATION_CHOICE_FIELD = "allowTokenizationChoice";

const INVOICE_CREATE_REPLY = { invoiceId: SYNTHETIC_INVOICE_ID, pageUrl: PAGE_URL };

const makeChargeReply = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  invoiceId: SYNTHETIC_INVOICE_ID,
  status: "success",
  amount: SYNTHETIC_AMOUNT_CENTS,
  ccy: UAH_CCY,
  createdDate: OFFSET_TIMESTAMP,
  modifiedDate: OFFSET_TIMESTAMP,
  ...overrides,
});

type MerchantPaymInfoSource = {
  amountCents: number;
  reference: string;
  description: string;
  basketLine: BasketLine;
};

const expectedMerchantPaymInfo = (source: MerchantPaymInfoSource): Record<string, unknown> => ({
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

const expectedInvoiceBody = (
  input: CreatePurchaseInput,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
  amount: input.amountCents,
  ccy: UAH_CCY,
  merchantPaymInfo: expectedMerchantPaymInfo(input),
  redirectUrl: input.redirectUrl,
  webHookUrl: input.webhookUrl,
  paymentType: PAYMENT_TYPE_DEBIT,
  ...extra,
});

const expectedChargeBody = (input: ChargeStoredCardInput): Record<string, unknown> => ({
  cardToken: input.cardToken,
  amount: input.amountCents,
  ccy: UAH_CCY,
  initiationKind: INITIATION_KIND_MERCHANT,
  merchantPaymInfo: expectedMerchantPaymInfo(input),
  paymentType: PAYMENT_TYPE_DEBIT,
  webHookUrl: input.webhookUrl,
});

type PortCall = [string, (adapter: PaymentPort) => Promise<unknown>, () => Response];

const EVERY_PORT_CALL: PortCall[] = [
  [
    "createPurchase",
    (adapter) => adapter.createPurchase(makePurchaseInput()),
    () => jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY),
  ],
  [
    "chargeStoredCard",
    (adapter) => adapter.chargeStoredCard(makeChargeInput()),
    () => jsonResponse(OK_STATUS, makeChargeReply()),
  ],
  [
    "fetchPurchase",
    (adapter) => adapter.fetchPurchase(SYNTHETIC_INVOICE_ID),
    () => jsonResponse(OK_STATUS, makeInvoiceBody()),
  ],
  [
    "forgetStoredCard",
    (adapter) => adapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN),
    () => emptyResponse(NO_CONTENT_STATUS),
  ],
];

describe("createMonobankAdapter requests", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let adapter: PaymentPort;

  beforeEach(() => {
    fetchMock.mockReset();
    adapter = createMonobankAdapter(makeAdapterConfig({ fetch: fetchMock }));
  });

  describe("createPurchase", () => {
    it("posts the invoice with a one-line basket and no saved card when storeCard is null", async () => {
      const input = makePurchaseInput();

      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await adapter.createPurchase(input);

      const request = requestOf(fetchMock, 0);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(request.url).toBe(`${TEST_API_URL}/api/merchant/invoice/create`);
      expect(request.init.method).toBe("POST");
      expect(request.headers).toEqual({
        "X-Token": TEST_MERCHANT_TOKEN,
        "Content-Type": JSON_CONTENT_TYPE,
      });
      expect(request.json).toEqual(expectedInvoiceBody(input));
    });

    it("sends saveCardData with saveCard true and the wallet id exactly when storeCard is given", async () => {
      const input = makePurchaseInput({ storeCard: { walletId: SYNTHETIC_WALLET_ID } });

      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await adapter.createPurchase(input);

      expect(requestOf(fetchMock, 0).json).toEqual(
        expectedInvoiceBody(input, {
          saveCardData: { saveCard: true, walletId: SYNTHETIC_WALLET_ID },
        }),
      );
    });

    it.each([
      ["without a stored card", null],
      ["with a stored card", { walletId: SYNTHETIC_WALLET_ID }],
    ])("never sends the tokenization choice %s", async (_label, storeCard) => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await adapter.createPurchase(makePurchaseInput({ storeCard }));

      expect(requestOf(fetchMock, 0).body).not.toContain(TOKENIZATION_CHOICE_FIELD);
    });

    it("sends validity only when validitySeconds is given", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY))
        .mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await adapter.createPurchase(makePurchaseInput({ validitySeconds: VALIDITY_SECONDS }));
      await adapter.createPurchase(makePurchaseInput());

      expect(requestOf(fetchMock, 0).json).toMatchObject({ validity: VALIDITY_SECONDS });
      expect(requestOf(fetchMock, 1).json).not.toHaveProperty("validity");
    });

    it.each([
      [Currency.UAH, UAH_CCY],
      [Currency.USD, USD_CCY],
      [Currency.EUR, EUR_CCY],
    ])("encodes %s as ccy %i", async (currency, ccy) => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await adapter.createPurchase(makePurchaseInput({ currency }));

      expect(requestOf(fetchMock, 0).json).toMatchObject({ ccy });
    });

    it("returns the invoice id as providerRef and the hosted page as redirectUrl", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, INVOICE_CREATE_REPLY));

      await expect(adapter.createPurchase(makePurchaseInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        redirectUrl: PAGE_URL,
      });
    });

    it("refuses to send an invoice with a fractional amount and sends nothing", async () => {
      const error = await captureAppError(
        adapter.createPurchase(makePurchaseInput({ amountCents: FRACTIONAL_AMOUNT })),
      );

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe("monobank request is invalid");
      expect(error.details).toMatchObject({ path: "/api/merchant/invoice/create" });
      expect(error.details?.issues).toContainEqual({ path: "amount", code: "invalid_type" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("chargeStoredCard", () => {
    it("posts a merchant-initiated debit on the card token", async () => {
      const input = makeChargeInput();

      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeChargeReply()));

      await adapter.chargeStoredCard(input);

      const request = requestOf(fetchMock, 0);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(request.url).toBe(`${TEST_API_URL}/api/merchant/wallet/payment`);
      expect(request.init.method).toBe("POST");
      expect(request.headers).toEqual({
        "X-Token": TEST_MERCHANT_TOKEN,
        "Content-Type": JSON_CONTENT_TYPE,
      });
      expect(request.json).toEqual(expectedChargeBody(input));
    });

    it("reads a synchronous success with an offset timestamp", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeChargeReply()));

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "SUCCEEDED",
        challengeUrl: null,
        modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
      });
    });

    it("returns a PROCESSING outcome with the 3-D Secure link instead of throwing", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(OK_STATUS, makeChargeReply({ status: "processing", tdsUrl: CHALLENGE_URL })),
      );

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "PROCESSING",
        challengeUrl: CHALLENGE_URL,
        modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
      });
    });

    it("returns a FAILED outcome for a declined charge answered with 200", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(OK_STATUS, makeChargeReply({ status: "failure" })),
      );

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "FAILED",
        challengeUrl: null,
        modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
      });
    });
  });

  describe("fetchPurchase", () => {
    it("gets the invoice status by invoice id with no body and no Content-Type", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

      await adapter.fetchPurchase(SYNTHETIC_INVOICE_ID);

      const request = requestOf(fetchMock, 0);

      expect(request.url).toBe(
        `${TEST_API_URL}/api/merchant/invoice/status?invoiceId=${SYNTHETIC_INVOICE_ID}`,
      );
      expect(request.init.method).toBe("GET");
      expect(request.headers).toEqual({ "X-Token": TEST_MERCHANT_TOKEN });
      expect(request.body).toBeUndefined();
    });
  });

  describe("forgetStoredCard", () => {
    it.each([
      ["a 200 with a JSON body", () => jsonResponse(OK_STATUS, { status: "success" })],
      ["a 200 with an empty body", () => emptyResponse(OK_STATUS)],
      ["a 204", () => emptyResponse(NO_CONTENT_STATUS)],
    ])("resolves on %s", async (_label, reply) => {
      fetchMock.mockResolvedValueOnce(reply());

      await expect(adapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN)).resolves.toBeUndefined();
    });

    it("deletes the card by token with no body and no Content-Type", async () => {
      fetchMock.mockResolvedValueOnce(emptyResponse(OK_STATUS));

      await adapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN);

      const request = requestOf(fetchMock, 0);

      expect(request.url).toBe(
        `${TEST_API_URL}/api/merchant/wallet/card?cardToken=${SYNTHETIC_CARD_TOKEN}`,
      );
      expect(request.init.method).toBe("DELETE");
      expect(request.headers).toEqual({ "X-Token": TEST_MERCHANT_TOKEN });
      expect(request.body).toBeUndefined();
    });

    it("encodes a card token with reserved characters in the query", async () => {
      fetchMock.mockResolvedValueOnce(emptyResponse(OK_STATUS));

      await adapter.forgetStoredCard(RESERVED_CHARACTER_CARD_TOKEN);

      const { url } = requestOf(fetchMock, 0);

      expect(url).toBe(`${TEST_API_URL}/api/merchant/wallet/card?cardToken=a%2Bb%2Fc%3D`);
      expect(new URL(url).searchParams.get("cardToken")).toBe(RESERVED_CHARACTER_CARD_TOKEN);
    });
  });

  describe("every method", () => {
    it.each(EVERY_PORT_CALL)(
      "sends the X-Token, no Idempotency-Key, redirect error and no-store from %s",
      async (_name, call, reply) => {
        fetchMock.mockResolvedValueOnce(reply());

        await call(adapter);

        const request = requestOf(fetchMock, 0);

        expect(request.headers["X-Token"]).toBe(TEST_MERCHANT_TOKEN);
        expect(request.headers).not.toHaveProperty("Idempotency-Key");
        expect(request.init.redirect).toBe("error");
        expect(request.init.cache).toBe("no-store");
      },
    );
  });
});
