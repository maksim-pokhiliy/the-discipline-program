import { beforeEach, describe, expect, it, vi } from "vitest";

import { Currency } from "@repo/contracts/common";
import { BadGatewayError } from "@repo/errors";

import {
  captureThrownAppError,
  makeAdapterConfig,
  makeInvoiceBody,
  readWebhookCapture,
  SYNTHETIC_AMOUNT_CENTS,
  SYNTHETIC_CARD_TOKEN,
  SYNTHETIC_INVOICE_DATE,
  SYNTHETIC_INVOICE_ID,
  SYNTHETIC_REFERENCE,
  SYNTHETIC_WALLET_ID,
  textResponse,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { PaymentPort, PurchaseState } from "./port";

const OK_STATUS = 200;
const UNKNOWN_CCY = 999;
const UNIX_SECONDS = 1_758_797_741;
const UNKNOWN_STATUS = "SYNTHETIC-UNKNOWN-STATUS";
const NOT_JSON_BODY = "SYNTHETIC not json";
const OFFSET_TIMESTAMP = "2026-09-25T14:23:28.764528+03:00";
const OFFSET_TIMESTAMP_AS_DATE = new Date("2026-09-25T11:23:28.764Z");
const SYNTHETIC_MASKED_PAN = "424242******4242";
const SYNTHETIC_PAYMENT_SYSTEM = "visa";
const UNREADABLE_INVOICE_MESSAGE = "monobank sent an invoice we cannot read";

const CAPTURED_MIT_INVOICE_ID = "2609254jRCJHF2jM5rb3";
const CAPTURED_MIT_REFERENCE = "spike-webhook-mit";
const CAPTURED_MIT_DATE = new Date("2026-09-25T11:23:28Z");
const CAPTURED_AMOUNT_CENTS = 100;

const expectedSyntheticState = (overrides: Partial<PurchaseState> = {}): PurchaseState => ({
  providerRef: SYNTHETIC_INVOICE_ID,
  status: "AWAITING_PAYMENT",
  amountCents: SYNTHETIC_AMOUNT_CENTS,
  currency: Currency.UAH,
  reference: SYNTHETIC_REFERENCE,
  createdAt: new Date(SYNTHETIC_INVOICE_DATE),
  modifiedAt: new Date(SYNTHETIC_INVOICE_DATE),
  storedCard: null,
  paidWith: null,
  ...overrides,
});

const bodyOf = (overrides: Record<string, unknown>): string =>
  JSON.stringify(makeInvoiceBody(overrides));

describe("createMonobankAdapter parsing", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let adapter: PaymentPort;

  beforeEach(() => {
    fetchMock.mockReset();
    adapter = createMonobankAdapter(makeAdapterConfig({ fetch: fetchMock }));
  });

  describe("the captured webhooks", () => {
    it("reads the created capture as AWAITING_PAYMENT with its reference, amount, currency and dates", () => {
      const { rawBody } = readWebhookCapture("created");
      const createdAt = new Date("2026-09-25T11:23:56Z");

      expect(adapter.parseWebhook(rawBody)).toEqual({
        providerRef: "260925ukRrMaiFq8o2F",
        status: "AWAITING_PAYMENT",
        amountCents: CAPTURED_AMOUNT_CENTS,
        currency: Currency.UAH,
        reference: "spike-webhook-expire-2",
        createdAt,
        modifiedAt: createdAt,
        storedCard: null,
        paidWith: null,
      });
    });

    it("reads the processing capture as PROCESSING", () => {
      const { rawBody } = readWebhookCapture("processing");

      expect(adapter.parseWebhook(rawBody)).toEqual({
        providerRef: CAPTURED_MIT_INVOICE_ID,
        status: "PROCESSING",
        amountCents: CAPTURED_AMOUNT_CENTS,
        currency: Currency.UAH,
        reference: CAPTURED_MIT_REFERENCE,
        createdAt: CAPTURED_MIT_DATE,
        modifiedAt: CAPTURED_MIT_DATE,
        storedCard: null,
        paidWith: null,
      });
    });

    it("reads the success capture with the card it was paid with and no stored card", () => {
      const { rawBody } = readWebhookCapture("success");

      expect(adapter.parseWebhook(rawBody)).toEqual({
        providerRef: CAPTURED_MIT_INVOICE_ID,
        status: "SUCCEEDED",
        amountCents: CAPTURED_AMOUNT_CENTS,
        currency: Currency.UAH,
        reference: CAPTURED_MIT_REFERENCE,
        createdAt: CAPTURED_MIT_DATE,
        modifiedAt: CAPTURED_MIT_DATE,
        storedCard: null,
        paidWith: { maskedPan: "42424242******42", paymentSystem: "visa" },
      });
    });
  });

  describe("statuses", () => {
    it.each([
      ["created", "AWAITING_PAYMENT"],
      ["processing", "PROCESSING"],
      ["hold", "HELD"],
      ["success", "SUCCEEDED"],
      ["failure", "FAILED"],
      ["reversed", "REFUNDED"],
      ["expired", "EXPIRED"],
    ])("maps the Monobank status %s to %s", (status, expected) => {
      expect(adapter.parseWebhook(bodyOf({ status })).status).toBe(expected);
    });

    it("throws BadGatewayError for an unknown status and names the path and code but not the value", () => {
      const body = bodyOf({ status: UNKNOWN_STATUS });
      const error = captureThrownAppError(() => adapter.parseWebhook(body));
      const exposed = `${error.message} ${JSON.stringify(error.details)}`;

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe(UNREADABLE_INVOICE_MESSAGE);
      expect(error.details).toEqual({ issues: [{ path: "status", code: "invalid_enum_value" }] });
      expect(exposed).not.toContain(UNKNOWN_STATUS);
      expect(exposed).not.toContain(body);
    });
  });

  describe("currency", () => {
    it("throws BadGatewayError for an unknown ccy", () => {
      const error = captureThrownAppError(() => adapter.parseWebhook(bodyOf({ ccy: UNKNOWN_CCY })));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({ issues: [{ path: "ccy", code: "custom" }] });
    });
  });

  describe("dates", () => {
    it.each([
      [SYNTHETIC_INVOICE_DATE, new Date(SYNTHETIC_INVOICE_DATE)],
      [OFFSET_TIMESTAMP, OFFSET_TIMESTAMP_AS_DATE],
    ])("accepts the invoice date form %s", (date, expected) => {
      const state = adapter.parseWebhook(bodyOf({ createdDate: date, modifiedDate: date }));

      expect(state.createdAt).toEqual(expected);
      expect(state.modifiedAt).toEqual(expected);
    });

    it.each([
      ["a date-only value", "2026-09-25"],
      ["a space-separated value", "2026-09-25 10:55:41Z"],
      ["a numeric value", UNIX_SECONDS],
    ])("refuses %s", (_label, createdDate) => {
      const error = captureThrownAppError(() => adapter.parseWebhook(bodyOf({ createdDate })));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toMatchObject({ issues: [{ path: "createdDate" }] });
    });
  });

  describe("unreadable bodies", () => {
    it("throws BadGatewayError for a body that is not JSON without echoing it", () => {
      const error = captureThrownAppError(() => adapter.parseWebhook(NOT_JSON_BODY));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe(UNREADABLE_INVOICE_MESSAGE);
      expect(error.details).toEqual({ issues: [{ path: "", code: "invalid_json" }] });
      expect(JSON.stringify(error.details)).not.toContain(NOT_JSON_BODY);
    });
  });

  describe("stored cards", () => {
    it("reads a created wallet as a STORED card with its token", () => {
      const walletData = {
        walletId: SYNTHETIC_WALLET_ID,
        cardToken: SYNTHETIC_CARD_TOKEN,
        status: "created",
        maskedPan: SYNTHETIC_MASKED_PAN,
        paymentSystem: SYNTHETIC_PAYMENT_SYSTEM,
      };

      expect(adapter.parseWebhook(bodyOf({ status: "success", walletData })).storedCard).toEqual({
        status: "STORED",
        walletId: SYNTHETIC_WALLET_ID,
        cardToken: SYNTHETIC_CARD_TOKEN,
        maskedPan: SYNTHETIC_MASKED_PAN,
        paymentSystem: SYNTHETIC_PAYMENT_SYSTEM,
      });
    });

    it.each([
      ["new", "PENDING"],
      ["failed", "FAILED"],
    ])("reads a %s wallet without a token as %s with a null token", (status, expected) => {
      const walletData = { walletId: SYNTHETIC_WALLET_ID, status };

      expect(adapter.parseWebhook(bodyOf({ walletData })).storedCard).toEqual({
        status: expected,
        walletId: SYNTHETIC_WALLET_ID,
        cardToken: null,
        maskedPan: null,
        paymentSystem: null,
      });
    });

    it("refuses a created wallet without a token", () => {
      const walletData = { walletId: SYNTHETIC_WALLET_ID, status: "created" };
      const error = captureThrownAppError(() => adapter.parseWebhook(bodyOf({ walletData })));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({
        issues: [{ path: "walletData.cardToken", code: "invalid_type" }],
      });
    });
  });

  describe("the paying card", () => {
    it("leaves paidWith null when paymentInfo lacks a masked PAN", () => {
      const paymentInfo = { paymentSystem: SYNTHETIC_PAYMENT_SYSTEM };

      expect(adapter.parseWebhook(bodyOf({ paymentInfo })).paidWith).toBeNull();
    });
  });

  describe("shared parser", () => {
    it("returns the same state from fetchPurchase and parseWebhook for the same body", async () => {
      const { rawBody } = readWebhookCapture("success");

      fetchMock.mockResolvedValueOnce(textResponse(OK_STATUS, rawBody));

      await expect(adapter.fetchPurchase(CAPTURED_MIT_INVOICE_ID)).resolves.toEqual(
        adapter.parseWebhook(rawBody),
      );
    });

    it("reads a missing reference as null", () => {
      expect(adapter.parseWebhook(bodyOf({ reference: undefined }))).toEqual(
        expectedSyntheticState({ reference: null }),
      );
    });

    it("ignores top-level fields it does not know", () => {
      const body = bodyOf({
        finalAmount: 0,
        payMethod: "wallet",
        cancelList: [],
        futureField: { nested: true },
      });

      expect(adapter.parseWebhook(body)).toEqual(expectedSyntheticState());
    });
  });
});
