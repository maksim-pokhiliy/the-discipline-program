import { beforeEach, describe, expect, it, vi } from "vitest";

import { Currency } from "@repo/contracts/common";
import { BadGatewayError, InternalServerError } from "@repo/errors";

import {
  captureAppError,
  CURRENCY_CODES,
  emptyResponse,
  EVERY_PORT_CALL,
  INVOICE_CREATE_PATH,
  INVOICE_CREATE_REPLY,
  INVOICE_STATUS_PATH,
  jsonResponse,
  makeAdapterConfig,
  makeChargeInput,
  makeChargeReply,
  makeInvoiceBody,
  makePurchaseInput,
  NO_CONTENT_STATUS,
  OFFSET_TIMESTAMP_AS_DATE,
  OK_STATUS,
  OUTGOING_INVALID_MESSAGE,
  PAGE_URL,
  requestOf,
  RESERVED_CHARACTER_CARD_TOKEN,
  SYNTHETIC_AMOUNT_CENTS,
  SYNTHETIC_CARD_TOKEN,
  SYNTHETIC_INVOICE_ID,
  SYNTHETIC_WALLET_ID,
  TEST_API_URL,
  TEST_MERCHANT_TOKEN,
  textResponse,
  UAH_CCY,
  UNKNOWN_CCY,
  UNREADABLE_CHARGE_REPLY_MESSAGE,
  UNREADABLE_INVOICE_MESSAGE,
  UNREADABLE_INVOICE_REPLY_MESSAGE,
  USD_CCY,
  WALLET_CARD_PATH,
  WALLET_PAYMENT_PATH,
  type WireIssue,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { ChargeStoredCardInput, CreatePurchaseInput, PaymentPort } from "./port";

const BASKET_QUANTITY = 1;
const BASKET_UNIT = "шт.";
const PAYMENT_TYPE_DEBIT = "debit";
const INITIATION_KIND_MERCHANT = "merchant";
const VALIDITY_SECONDS = 3_600;
const FRACTIONAL_AMOUNT = 4_900.5;
const FRACTIONAL_VALIDITY = 1.5;
const HUGE_AMOUNT = 1e21;
const FIRST_UNSAFE_EVEN_AMOUNT = 2 ** 53 + 2;
const NEGATIVE_AMOUNT = -1;
const REPLIED_AMOUNT_CENTS = 1;
const CREATED_STATUS = 201;
const ACCEPTED_STATUS = 202;
const JSON_CONTENT_TYPE = "application/json";
const CHALLENGE_URL = "https://pay.monobank.test/fake-tds/synthetic-invoice-0001";
const NOT_A_URL = "not a url";
const TOKENIZATION_CHOICE_FIELD = "allowTokenizationChoice";
const NOT_JSON_REPLY = "<html>ok</html>";

const DECLINE_FIELDS: [string, Record<string, unknown>][] = [
  ["without a ccy or an amount", {}],
  ["with a null ccy", { ccy: null }],
  ["with an empty ccy", { ccy: "" }],
  ["with a null amount", { amount: null }],
  ["with an empty amount", { amount: "" }],
];

type BasketSource = Pick<
  ChargeStoredCardInput,
  "amountCents" | "reference" | "description" | "basketLine"
>;

const expectedMerchantPaymInfo = (source: BasketSource): Record<string, unknown> => ({
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

const makeDeclineReply = (fields: Record<string, unknown>): Record<string, unknown> =>
  makeChargeReply({ status: "failure", amount: undefined, ccy: undefined, ...fields });

type PortCallOf = (adapter: PaymentPort) => Promise<unknown>;

type EmptyIdCase = [string, PortCallOf, string, string];

const EMPTY_ID_CASES: EmptyIdCase[] = [
  ["forgetStoredCard", (adapter) => adapter.forgetStoredCard(""), WALLET_CARD_PATH, "cardToken"],
  ["fetchPurchase", (adapter) => adapter.fetchPurchase(""), INVOICE_STATUS_PATH, "invoiceId"],
];

type AmountWrite = (adapter: PaymentPort, amountCents: number) => Promise<unknown>;

const AMOUNT_WRITES: [string, AmountWrite][] = [
  [
    "createPurchase",
    (adapter, amountCents) => adapter.createPurchase(makePurchaseInput({ amountCents })),
  ],
  [
    "chargeStoredCard",
    (adapter, amountCents) => adapter.chargeStoredCard(makeChargeInput({ amountCents })),
  ],
];

const UNSAFE_AMOUNT_CASES = AMOUNT_WRITES.flatMap(([name, write]) =>
  [HUGE_AMOUNT, FIRST_UNSAFE_EVEN_AMOUNT].map((amountCents): [string, number, AmountWrite] => [
    name,
    amountCents,
    write,
  ]),
);

const invoiceWith =
  (overrides: Partial<CreatePurchaseInput>): PortCallOf =>
  (adapter) =>
    adapter.createPurchase(makePurchaseInput(overrides));

const chargeWith =
  (overrides: Partial<ChargeStoredCardInput>): PortCallOf =>
  (adapter) =>
    adapter.chargeStoredCard(makeChargeInput(overrides));

const fetchTheInvoice: PortCallOf = (adapter) => adapter.fetchPurchase(SYNTHETIC_INVOICE_ID);

const basketLineWith = (
  overrides: Partial<CreatePurchaseInput["basketLine"]>,
): Pick<CreatePurchaseInput, "basketLine"> => ({
  basketLine: { ...makePurchaseInput().basketLine, ...overrides },
});

type OutgoingCase = [label: string, call: PortCallOf, path: string, issue: WireIssue];

const INVALID_OUTGOING_CASES: OutgoingCase[] = [
  [
    "an invoice with an empty reference",
    invoiceWith({ reference: "" }),
    INVOICE_CREATE_PATH,
    { path: "merchantPaymInfo.reference", code: "too_small" },
  ],
  [
    "an invoice with an empty description",
    invoiceWith({ description: "" }),
    INVOICE_CREATE_PATH,
    { path: "merchantPaymInfo.destination", code: "too_small" },
  ],
  [
    "an invoice with an empty basket name",
    invoiceWith(basketLineWith({ name: "" })),
    INVOICE_CREATE_PATH,
    { path: "merchantPaymInfo.basketOrder.0.name", code: "too_small" },
  ],
  [
    "an invoice with an empty basket code",
    invoiceWith(basketLineWith({ code: "" })),
    INVOICE_CREATE_PATH,
    { path: "merchantPaymInfo.basketOrder.0.code", code: "too_small" },
  ],
  [
    "an invoice that stores the card under an empty wallet id",
    invoiceWith({ storeCard: { walletId: "" } }),
    INVOICE_CREATE_PATH,
    { path: "saveCardData.walletId", code: "too_small" },
  ],
  [
    "an invoice whose return URL is not a URL",
    invoiceWith({ redirectUrl: NOT_A_URL }),
    INVOICE_CREATE_PATH,
    { path: "redirectUrl", code: "invalid_string" },
  ],
  [
    "an invoice whose webhook URL is not a URL",
    invoiceWith({ webhookUrl: NOT_A_URL }),
    INVOICE_CREATE_PATH,
    { path: "webHookUrl", code: "invalid_string" },
  ],
  [
    "an invoice with the amount 0",
    invoiceWith({ amountCents: 0 }),
    INVOICE_CREATE_PATH,
    { path: "amount", code: "too_small" },
  ],
  [
    "an invoice with a negative amount",
    invoiceWith({ amountCents: NEGATIVE_AMOUNT }),
    INVOICE_CREATE_PATH,
    { path: "amount", code: "too_small" },
  ],
  [
    "an invoice with the validity 0",
    invoiceWith({ validitySeconds: 0 }),
    INVOICE_CREATE_PATH,
    { path: "validity", code: "too_small" },
  ],
  [
    "an invoice with a fractional validity",
    invoiceWith({ validitySeconds: FRACTIONAL_VALIDITY }),
    INVOICE_CREATE_PATH,
    { path: "validity", code: "invalid_type" },
  ],
  [
    "an invoice with the validity 1e+21",
    invoiceWith({ validitySeconds: HUGE_AMOUNT }),
    INVOICE_CREATE_PATH,
    { path: "validity", code: "too_big" },
  ],
  [
    "a charge with an empty card token",
    chargeWith({ cardToken: "" }),
    WALLET_PAYMENT_PATH,
    { path: "cardToken", code: "too_small" },
  ],
  [
    "a charge whose webhook URL is not a URL",
    chargeWith({ webhookUrl: NOT_A_URL }),
    WALLET_PAYMENT_PATH,
    { path: "webHookUrl", code: "invalid_string" },
  ],
  [
    "a charge with the amount 0",
    chargeWith({ amountCents: 0 }),
    WALLET_PAYMENT_PATH,
    { path: "amount", code: "too_small" },
  ],
];

type ReplyCase = [
  label: string,
  call: PortCallOf,
  reply: () => Response,
  message: string,
  issue: WireIssue,
];

const UNREADABLE_REPLY_CASES: ReplyCase[] = [
  [
    "an invoice reply with an empty invoice id",
    invoiceWith({}),
    () => jsonResponse(OK_STATUS, { ...INVOICE_CREATE_REPLY, invoiceId: "" }),
    UNREADABLE_INVOICE_REPLY_MESSAGE,
    { path: "invoiceId", code: "too_small" },
  ],
  [
    "an invoice reply whose page URL is not a URL",
    invoiceWith({}),
    () => jsonResponse(OK_STATUS, { ...INVOICE_CREATE_REPLY, pageUrl: NOT_A_URL }),
    UNREADABLE_INVOICE_REPLY_MESSAGE,
    { path: "pageUrl", code: "invalid_string" },
  ],
  [
    "a charge reply with an empty invoice id",
    chargeWith({}),
    () => jsonResponse(OK_STATUS, makeChargeReply({ invoiceId: "" })),
    UNREADABLE_CHARGE_REPLY_MESSAGE,
    { path: "invoiceId", code: "too_small" },
  ],
  [
    "a charge reply whose 3-D Secure link is not a URL",
    chargeWith({}),
    () => jsonResponse(OK_STATUS, makeChargeReply({ status: "processing", tdsUrl: NOT_A_URL })),
    UNREADABLE_CHARGE_REPLY_MESSAGE,
    { path: "tdsUrl", code: "invalid_string" },
  ],
  [
    "a charge reply with a fractional amount",
    chargeWith({}),
    () => jsonResponse(OK_STATUS, makeChargeReply({ amount: FRACTIONAL_AMOUNT })),
    UNREADABLE_CHARGE_REPLY_MESSAGE,
    { path: "amount", code: "invalid_type" },
  ],
  [
    "a status reply with an empty invoice id",
    fetchTheInvoice,
    () => jsonResponse(OK_STATUS, makeInvoiceBody({ invoiceId: "" })),
    UNREADABLE_INVOICE_MESSAGE,
    { path: "invoiceId", code: "too_small" },
  ],
  [
    "a status reply with a fractional amount",
    fetchTheInvoice,
    () => jsonResponse(OK_STATUS, makeInvoiceBody({ amount: FRACTIONAL_AMOUNT })),
    UNREADABLE_INVOICE_MESSAGE,
    { path: "amount", code: "invalid_type" },
  ],
  [
    "a status reply with a negative amount",
    fetchTheInvoice,
    () => jsonResponse(OK_STATUS, makeInvoiceBody({ amount: NEGATIVE_AMOUNT })),
    UNREADABLE_INVOICE_MESSAGE,
    { path: "amount", code: "too_small" },
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
      expect(request.url).toBe(`${TEST_API_URL}${INVOICE_CREATE_PATH}`);
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

    it.each(CURRENCY_CODES)("encodes %s as ccy %i", async (currency, ccy) => {
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
      expect(error.message).toBe(OUTGOING_INVALID_MESSAGE);
      expect(error.details).toMatchObject({ path: INVOICE_CREATE_PATH });
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
      expect(request.url).toBe(`${TEST_API_URL}${WALLET_PAYMENT_PATH}`);
      expect(request.init.method).toBe("POST");
      expect(request.headers).toEqual({
        "X-Token": TEST_MERCHANT_TOKEN,
        "Content-Type": JSON_CONTENT_TYPE,
      });
      expect(request.json).toEqual(expectedChargeBody(input));
    });

    it.each(CURRENCY_CODES)("encodes the charge currency %s as ccy %i", async (currency, ccy) => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeChargeReply()));

      await adapter.chargeStoredCard(makeChargeInput({ currency }));

      expect(requestOf(fetchMock, 0).json).toMatchObject({ ccy });
    });

    it("reads a synchronous success with an offset timestamp", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeChargeReply()));

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "SUCCEEDED",
        amountCents: SYNTHETIC_AMOUNT_CENTS,
        currency: Currency.UAH,
        challengeUrl: null,
        modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
      });
    });

    it("returns the amount and the currency of the reply, not the ones it asked for", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(OK_STATUS, makeChargeReply({ amount: REPLIED_AMOUNT_CENTS, ccy: USD_CCY })),
      );

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toMatchObject({
        amountCents: REPLIED_AMOUNT_CENTS,
        currency: Currency.USD,
      });
    });

    it("returns a PROCESSING outcome with the 3-D Secure link instead of throwing", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(OK_STATUS, makeChargeReply({ status: "processing", tdsUrl: CHALLENGE_URL })),
      );

      await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "PROCESSING",
        amountCents: SYNTHETIC_AMOUNT_CENTS,
        currency: Currency.UAH,
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
        amountCents: SYNTHETIC_AMOUNT_CENTS,
        currency: Currency.UAH,
        challengeUrl: null,
        modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
      });
    });

    it.each(DECLINE_FIELDS)(
      "returns a FAILED outcome for a 200 decline %s",
      async (_label, fields) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeDeclineReply(fields)));

        await expect(adapter.chargeStoredCard(makeChargeInput())).resolves.toEqual({
          providerRef: SYNTHETIC_INVOICE_ID,
          status: "FAILED",
          amountCents: null,
          currency: null,
          challengeUrl: null,
          modifiedAt: OFFSET_TIMESTAMP_AS_DATE,
        });
      },
    );

    it("refuses a charge reply with an unknown ccy", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(OK_STATUS, makeChargeReply({ ccy: UNKNOWN_CCY })),
      );

      const error = await captureAppError(adapter.chargeStoredCard(makeChargeInput()));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe(UNREADABLE_CHARGE_REPLY_MESSAGE);
      expect(error.details).toEqual({ issues: [{ path: "ccy", code: "custom" }] });
    });

    it("refuses a 200 charge reply that is not JSON", async () => {
      fetchMock.mockResolvedValueOnce(textResponse(OK_STATUS, NOT_JSON_REPLY));

      const error = await captureAppError(adapter.chargeStoredCard(makeChargeInput()));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe(UNREADABLE_CHARGE_REPLY_MESSAGE);
      expect(error.details).toEqual({ issues: [{ path: "", code: "invalid_json" }] });
    });

    it("refuses to send a charge with a fractional amount and sends nothing", async () => {
      const error = await captureAppError(
        adapter.chargeStoredCard(makeChargeInput({ amountCents: FRACTIONAL_AMOUNT })),
      );

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe(OUTGOING_INVALID_MESSAGE);
      expect(error.details).toMatchObject({ path: WALLET_PAYMENT_PATH });
      expect(error.details?.issues).toContainEqual({ path: "amount", code: "invalid_type" });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("fetchPurchase", () => {
    it("gets the invoice status by invoice id with no body and no Content-Type", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

      await adapter.fetchPurchase(SYNTHETIC_INVOICE_ID);

      const request = requestOf(fetchMock, 0);

      expect(request.url).toBe(
        `${TEST_API_URL}${INVOICE_STATUS_PATH}?invoiceId=${SYNTHETIC_INVOICE_ID}`,
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
      ["a 201", () => emptyResponse(CREATED_STATUS)],
      ["a 202", () => emptyResponse(ACCEPTED_STATUS)],
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
        `${TEST_API_URL}${WALLET_CARD_PATH}?cardToken=${SYNTHETIC_CARD_TOKEN}`,
      );
      expect(request.init.method).toBe("DELETE");
      expect(request.headers).toEqual({ "X-Token": TEST_MERCHANT_TOKEN });
      expect(request.body).toBeUndefined();
    });

    it("encodes a card token with reserved characters in the query", async () => {
      fetchMock.mockResolvedValueOnce(emptyResponse(OK_STATUS));

      await adapter.forgetStoredCard(RESERVED_CHARACTER_CARD_TOKEN);

      const { url } = requestOf(fetchMock, 0);

      expect(url).toBe(`${TEST_API_URL}${WALLET_CARD_PATH}?cardToken=a%2Bb%2Fc%3D`);
      expect(new URL(url).searchParams.get("cardToken")).toBe(RESERVED_CHARACTER_CARD_TOKEN);
    });
  });

  describe("empty ids", () => {
    it.each(EMPTY_ID_CASES)(
      "refuses an empty id in %s and sends nothing",
      async (_name, call, path, issuePath) => {
        const error = await captureAppError(call(adapter));

        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.message).toBe(OUTGOING_INVALID_MESSAGE);
        expect(error.details).toEqual({ path, issues: [{ path: issuePath, code: "too_small" }] });
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe("unsafe amounts", () => {
    it.each(UNSAFE_AMOUNT_CASES)(
      "refuses %s with the amount %d and sends nothing",
      async (_name, amountCents, write) => {
        const error = await captureAppError(write(adapter, amountCents));

        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.message).toBe(OUTGOING_INVALID_MESSAGE);
        expect(error.details?.issues).toContainEqual({ path: "amount", code: "too_big" });
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe("invalid requests", () => {
    it.each(INVALID_OUTGOING_CASES)(
      "refuses to send %s and sends nothing",
      async (_label, call, path, issue) => {
        const error = await captureAppError(call(adapter));

        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.message).toBe(OUTGOING_INVALID_MESSAGE);
        expect(error.details).toMatchObject({ path });
        expect(error.details?.issues).toContainEqual(issue);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe("unreadable replies", () => {
    it.each(UNREADABLE_REPLY_CASES)(
      "refuses %s after one call",
      async (_label, call, reply, message, issue) => {
        fetchMock.mockResolvedValueOnce(reply());

        const error = await captureAppError(call(adapter));

        expect(error).toBeInstanceOf(BadGatewayError);
        expect(error.message).toBe(message);
        expect(error.details).toEqual({ issues: [issue] });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );
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
