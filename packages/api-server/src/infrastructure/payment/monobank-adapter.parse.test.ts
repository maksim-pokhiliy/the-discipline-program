import { beforeEach, describe, expect, it, vi } from "vitest";

import { Currency } from "@repo/contracts/common";
import { BadGatewayError } from "@repo/errors";

import {
  captureThrownAppError,
  EUR_CCY,
  jsonResponse,
  makeAdapterConfig,
  makeChargeInput,
  makeChargeReply,
  makeInvoiceBody,
  OFFSET_TIMESTAMP,
  OFFSET_TIMESTAMP_AS_DATE,
  OK_STATUS,
  readWebhookCapture,
  SYNTHETIC_AMOUNT_CENTS,
  SYNTHETIC_CARD_TOKEN,
  SYNTHETIC_INVOICE_DATE,
  SYNTHETIC_INVOICE_ID,
  SYNTHETIC_MODIFIED_DATE,
  SYNTHETIC_REFERENCE,
  SYNTHETIC_WALLET_ID,
  textResponse,
  UNKNOWN_CCY,
  UNREADABLE_INVOICE_MESSAGE,
  USD_CCY,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { ChargeOutcome, PaymentPort, PurchaseState, StoredCard } from "./port";

const UNIX_SECONDS = 1_758_797_741;
const UNKNOWN_STATUS = "SYNTHETIC-UNKNOWN-STATUS";
const NOT_JSON_BODY = "SYNTHETIC not json";
const SYNTHETIC_MASKED_PAN = "424242******4242";
const SYNTHETIC_PAYMENT_SYSTEM = "visa";

const CAPTURED_MIT_INVOICE_ID = "2609254jRCJHF2jM5rb3";
const CAPTURED_MIT_REFERENCE = "spike-webhook-mit";
const CAPTURED_MIT_DATE = new Date("2026-09-25T11:23:28Z");
const CAPTURED_AMOUNT_CENTS = 100;

const EMPTY_TEXT_VALUES: [string, string | null][] = [
  ["null", null],
  ["an empty string", ""],
];

type UnsettledWalletCase = [
  walletStatus: string,
  label: string,
  cardToken: string | null,
  cardStatus: "PENDING" | "FAILED",
  expectedToken: string | null,
];

const UNSETTLED_WALLET_TOKENS: UnsettledWalletCase[] = [
  ["new", "a null token", null, "PENDING", null],
  ["new", "an empty token", "", "PENDING", null],
  ["new", "a token", SYNTHETIC_CARD_TOKEN, "PENDING", SYNTHETIC_CARD_TOKEN],
  ["failed", "a null token", null, "FAILED", null],
  ["failed", "an empty token", "", "FAILED", null],
  ["failed", "a token", SYNTHETIC_CARD_TOKEN, "FAILED", SYNTHETIC_CARD_TOKEN],
];

const PARTIAL_PAYMENT_INFO: [string, Record<string, string>][] = [
  ["an empty masked PAN", { maskedPan: "", paymentSystem: SYNTHETIC_PAYMENT_SYSTEM }],
  ["an empty payment system", { maskedPan: SYNTHETIC_MASKED_PAN, paymentSystem: "" }],
];

const STORED_CARD_WITHOUT_DETAILS: StoredCard = {
  status: "STORED",
  walletId: SYNTHETIC_WALLET_ID,
  cardToken: SYNTHETIC_CARD_TOKEN,
  maskedPan: null,
  paymentSystem: null,
};

const PENDING_CARD_WITHOUT_DETAILS: StoredCard = {
  status: "PENDING",
  walletId: SYNTHETIC_WALLET_ID,
  cardToken: null,
  maskedPan: null,
  paymentSystem: null,
};

const SUCCEEDED_CHARGE_WITHOUT_CHALLENGE: ChargeOutcome = {
  providerRef: SYNTHETIC_INVOICE_ID,
  status: "SUCCEEDED",
  amountCents: SYNTHETIC_AMOUNT_CENTS,
  currency: Currency.UAH,
  challengeUrl: null,
  modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
};

const expectedSyntheticState = (overrides: Partial<PurchaseState> = {}): PurchaseState => ({
  providerRef: SYNTHETIC_INVOICE_ID,
  status: "AWAITING_PAYMENT",
  amountCents: SYNTHETIC_AMOUNT_CENTS,
  currency: Currency.UAH,
  reference: SYNTHETIC_REFERENCE,
  createdAt: new Date(SYNTHETIC_INVOICE_DATE),
  modifiedAt: new Date(SYNTHETIC_MODIFIED_DATE),
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

    it.each([
      [USD_CCY, Currency.USD],
      [EUR_CCY, Currency.EUR],
    ])("reads the ccy %i as %s", (ccy, currency) => {
      expect(adapter.parseWebhook(bodyOf({ ccy })).currency).toBe(currency);
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

    it("maps createdDate to createdAt and modifiedDate to modifiedAt", () => {
      const state = adapter.parseWebhook(
        bodyOf({ createdDate: SYNTHETIC_INVOICE_DATE, modifiedDate: SYNTHETIC_MODIFIED_DATE }),
      );

      expect(state.createdAt).toEqual(new Date(SYNTHETIC_INVOICE_DATE));
      expect(state.modifiedAt).toEqual(new Date(SYNTHETIC_MODIFIED_DATE));
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

    it.each(UNSETTLED_WALLET_TOKENS)(
      "reads a %s wallet with %s in a webhook and in a status reply",
      async (status, _label, cardToken, cardStatus, expectedToken) => {
        const body = bodyOf({ walletData: { walletId: SYNTHETIC_WALLET_ID, status, cardToken } });
        const expected: StoredCard = {
          status: cardStatus,
          walletId: SYNTHETIC_WALLET_ID,
          cardToken: expectedToken,
          maskedPan: null,
          paymentSystem: null,
        };

        fetchMock.mockResolvedValueOnce(textResponse(OK_STATUS, body));

        expect(adapter.parseWebhook(body).storedCard).toEqual(expected);
        await expect(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID)).resolves.toMatchObject({
          storedCard: expected,
        });
      },
    );

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

    it("leaves paidWith null when paymentInfo lacks a payment system", () => {
      const paymentInfo = { maskedPan: SYNTHETIC_MASKED_PAN };

      expect(adapter.parseWebhook(bodyOf({ paymentInfo })).paidWith).toBeNull();
    });

    it.each(PARTIAL_PAYMENT_INFO)(
      "leaves paidWith null when paymentInfo has %s and the other field",
      (_label, paymentInfo) => {
        expect(adapter.parseWebhook(bodyOf({ paymentInfo })).paidWith).toBeNull();
      },
    );
  });

  describe("empty optional fields", () => {
    it.each(EMPTY_TEXT_VALUES)(
      "reads %s in an optional text field as absent",
      async (_label, empty) => {
        const cardDetails = { maskedPan: empty, paymentSystem: empty };
        const storedWallet = {
          walletId: SYNTHETIC_WALLET_ID,
          status: "created",
          cardToken: SYNTHETIC_CARD_TOKEN,
          ...cardDetails,
        };
        const pendingWallet = { walletId: SYNTHETIC_WALLET_ID, status: "new", ...cardDetails };
        const storedBody = bodyOf({
          reference: empty,
          paymentInfo: cardDetails,
          walletData: storedWallet,
        });

        fetchMock.mockResolvedValueOnce(
          jsonResponse(OK_STATUS, makeChargeReply({ tdsUrl: empty })),
        );

        expect(adapter.parseWebhook(storedBody)).toEqual(
          expectedSyntheticState({ reference: null, storedCard: STORED_CARD_WITHOUT_DETAILS }),
        );
        expect(adapter.parseWebhook(bodyOf({ walletData: pendingWallet })).storedCard).toEqual(
          PENDING_CARD_WITHOUT_DETAILS,
        );
        await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual(
          SUCCEEDED_CHARGE_WITHOUT_CHALLENGE,
        );
      },
    );

    it("reads a null paymentInfo and a null walletData as absent", () => {
      expect(adapter.parseWebhook(bodyOf({ paymentInfo: null, walletData: null }))).toEqual(
        expectedSyntheticState(),
      );
    });

    it("still refuses a created wallet whose card token is empty", () => {
      const walletData = { walletId: SYNTHETIC_WALLET_ID, status: "created", cardToken: "" };
      const error = captureThrownAppError(() => adapter.parseWebhook(bodyOf({ walletData })));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({
        issues: [{ path: "walletData.cardToken", code: "too_small" }],
      });
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
