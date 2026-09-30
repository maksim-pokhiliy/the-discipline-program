import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadGatewayError,
  InternalServerError,
  TimeoutError,
  UnauthorizedError,
} from "@repo/errors";

import {
  captureAppError,
  emptyResponse,
  jsonResponse,
  makeAdapterConfig,
  makeChargeInput,
  makeInvoiceBody,
  makePurchaseInput,
  requestOf,
  SYNTHETIC_CARD_TOKEN,
  SYNTHETIC_INVOICE_ID,
  TEST_API_URL,
  TEST_MERCHANT_TOKEN,
  textResponse,
} from "./__fixtures__/monobank-fixtures";
import { createMonobankAdapter } from "./monobank-adapter";
import type { PaymentPort } from "./port";

const INVOICE_CREATE_PATH = "/api/merchant/invoice/create";
const INVOICE_STATUS_PATH = "/api/merchant/invoice/status";
const WALLET_PAYMENT_PATH = "/api/merchant/wallet/payment";
const WALLET_CARD_PATH = "/api/merchant/wallet/card";
const ATTEMPT_TIMEOUT_MS = 10_000;
const READ_ATTEMPTS = 3;
const HALF_JITTER = 0.5;
const FIRST_RETRY_AT_MS = 1_500;
const SECOND_RETRY_AT_MS = 4_000;
const OK_STATUS = 200;
const BAD_REQUEST_STATUS = 400;
const UNAUTHORIZED_STATUS = 401;
const TOO_MANY_REQUESTS_STATUS = 429;
const INTERNAL_SERVER_ERROR_STATUS = 500;
const SERVICE_UNAVAILABLE_STATUS = 503;
const INTERNAL_SERVER_ERROR_CODE = 500;
const API_HOST = "api.monobank.test";
const REDACTED = "[REDACTED]";
const MONOBANK_ERROR_BODY = { errCode: "1001", errText: "invalid 'amount'" };
const UNAVAILABLE_TEXT = "service unavailable";
const ECHO_ERROR_CODE = "BAD_REQUEST";
const RESERVED_CHARACTER_CARD_TOKEN = "a+b/c=";
const QUERY_ENCODED_CARD_TOKEN = "a%2Bb%2Fc%3D";

const LEAKABLE_CHARGE_INPUT = makeChargeInput();

const ECHOED_CARD_TOKENS: [string, string, string][] = [
  ["the card token", SYNTHETIC_CARD_TOKEN, SYNTHETIC_CARD_TOKEN],
  [
    "the query-encoded form of a card token with reserved characters",
    RESERVED_CHARACTER_CARD_TOKEN,
    QUERY_ENCODED_CARD_TOKEN,
  ],
];

type LeakCase = [string, (port: PaymentPort) => Promise<unknown>, string[]];

const LEAK_CASES: LeakCase[] = [
  [
    "chargeStoredCard",
    (port) => port.chargeStoredCard(LEAKABLE_CHARGE_INPUT),
    [
      LEAKABLE_CHARGE_INPUT.reference,
      LEAKABLE_CHARGE_INPUT.description,
      LEAKABLE_CHARGE_INPUT.webhookUrl,
    ],
  ],
  ["forgetStoredCard", (port) => port.forgetStoredCard(SYNTHETIC_CARD_TOKEN), []],
];

const unavailable = async (): Promise<Response> =>
  textResponse(SERVICE_UNAVAILABLE_STATUS, UNAVAILABLE_TEXT);

const abortedByTheSignal = (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      reject(new DOMException("aborted", "AbortError"));
    });
  });

const bodyStalledUntilAbort = async (
  _input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        init?.signal?.addEventListener("abort", () => {
          controller.error(new DOMException("aborted", "AbortError"));
        });
      },
    }),
    { status: OK_STATUS },
  );

describe("createMonobankAdapter transport", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let adapter: PaymentPort;

  beforeEach(() => {
    fetchMock.mockReset();
    adapter = createMonobankAdapter(makeAdapterConfig({ fetch: fetchMock }));
  });

  describe("retries and timeouts", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("sends a POST that meets a 503 exactly once and surfaces BadGatewayError", async () => {
      fetchMock.mockImplementation(unavailable);

      const captured = captureAppError(adapter.createPurchase(makePurchaseInput()));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({
        path: INVOICE_CREATE_PATH,
        status: SERVICE_UNAVAILABLE_STATUS,
        errCode: null,
        errText: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("sends a DELETE that meets a 503 exactly once", async () => {
      fetchMock.mockImplementation(unavailable);

      const captured = captureAppError(adapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN));

      await vi.runAllTimersAsync();

      expect(await captured).toBeInstanceOf(BadGatewayError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries a GET that meets 503 twice and succeeds on the third call without real waiting", async () => {
      fetchMock
        .mockImplementationOnce(unavailable)
        .mockImplementationOnce(unavailable)
        .mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

      const assertion = expect(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID)).resolves.toMatchObject({
        providerRef: SYNTHETIC_INVOICE_ID,
        status: "AWAITING_PAYMENT",
      });

      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(READ_ATTEMPTS);
    });

    it("waits the base delay, doubled on each retry, plus the jitter before each GET retry", async () => {
      vi.spyOn(Math, "random").mockReturnValue(HALF_JITTER);
      fetchMock
        .mockImplementationOnce(unavailable)
        .mockImplementationOnce(unavailable)
        .mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

      const assertion = expect(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID)).resolves.toMatchObject({
        providerRef: SYNTHETIC_INVOICE_ID,
      });

      await vi.advanceTimersByTimeAsync(FIRST_RETRY_AT_MS - 1);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(SECOND_RETRY_AT_MS - FIRST_RETRY_AT_MS - 1);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1);

      expect(fetchMock).toHaveBeenCalledTimes(READ_ATTEMPTS);

      await assertion;
    });

    it("retries a GET whose first attempt cannot reach Monobank", async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

      const assertion = expect(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID)).resolves.toMatchObject({
        providerRef: SYNTHETIC_INVOICE_ID,
      });

      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("surfaces BadGatewayError after three GET attempts that all meet 503", async () => {
      fetchMock.mockImplementation(unavailable);

      const captured = captureAppError(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe("monobank failed the request");
      expect(error.details).toEqual({
        path: INVOICE_STATUS_PATH,
        status: SERVICE_UNAVAILABLE_STATUS,
        errCode: null,
        errText: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(READ_ATTEMPTS);
    });

    it.each([INTERNAL_SERVER_ERROR_STATUS, TOO_MANY_REQUESTS_STATUS])(
      "retries a GET that meets %i and succeeds on the next call",
      async (status) => {
        fetchMock
          .mockResolvedValueOnce(jsonResponse(status, MONOBANK_ERROR_BODY))
          .mockResolvedValueOnce(jsonResponse(OK_STATUS, makeInvoiceBody()));

        const assertion = expect(
          adapter.fetchPurchase(SYNTHETIC_INVOICE_ID),
        ).resolves.toMatchObject({ providerRef: SYNTHETIC_INVOICE_ID });

        await vi.runAllTimersAsync();
        await assertion;

        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it("sends a POST that meets a 429 once and surfaces BadGatewayError", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(TOO_MANY_REQUESTS_STATUS, MONOBANK_ERROR_BODY),
      );

      const captured = captureAppError(adapter.chargeStoredCard(makeChargeInput()));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.details).toEqual({
        path: WALLET_PAYMENT_PATH,
        status: TOO_MANY_REQUESTS_STATUS,
        ...MONOBANK_ERROR_BODY,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a GET that meets 400", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(BAD_REQUEST_STATUS, MONOBANK_ERROR_BODY),
      );

      const captured = captureAppError(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID));

      await vi.runAllTimersAsync();

      expect(await captured).toBeInstanceOf(InternalServerError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("surfaces an aborted POST as TimeoutError after one call", async () => {
      fetchMock.mockRejectedValue(new DOMException("aborted", "AbortError"));

      const captured = captureAppError(adapter.createPurchase(makePurchaseInput()));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe("monobank did not answer in time");
      expect(error.details).toEqual({ path: INVOICE_CREATE_PATH, timeoutMs: ATTEMPT_TIMEOUT_MS });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("aborts an attempt at 10 s and not earlier", async () => {
      fetchMock.mockImplementation(abortedByTheSignal);

      const settled = vi.fn();
      const captured = captureAppError(adapter.createPurchase(makePurchaseInput()));

      void captured.then(settled, settled);

      await vi.advanceTimersByTimeAsync(ATTEMPT_TIMEOUT_MS - 1);

      expect(settled).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);

      expect(settled).toHaveBeenCalledTimes(1);
      expect(await captured).toBeInstanceOf(TimeoutError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("times out at 10 s a reply whose headers arrive at once but whose body never ends", async () => {
      fetchMock.mockImplementation(bodyStalledUntilAbort);

      const settled = vi.fn();
      const pending = adapter.createPurchase(makePurchaseInput());
      const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);

      void pending.then(settled, settled);

      await vi.advanceTimersByTimeAsync(ATTEMPT_TIMEOUT_MS - 1);

      expect(settled).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);

      expect(settled).toHaveBeenCalledTimes(1);

      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries a GET that times out and surfaces TimeoutError after three attempts", async () => {
      fetchMock.mockImplementation(abortedByTheSignal);

      const captured = captureAppError(adapter.fetchPurchase(SYNTHETIC_INVOICE_ID));

      await vi.runAllTimersAsync();

      const error = await captured;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.details).toEqual({ path: INVOICE_STATUS_PATH, timeoutMs: ATTEMPT_TIMEOUT_MS });
      expect(fetchMock).toHaveBeenCalledTimes(READ_ATTEMPTS);
    });
  });

  describe("error mapping", () => {
    it("surfaces a 400 on chargeStoredCard as InternalServerError with the Monobank error, never as a FAILED outcome", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(BAD_REQUEST_STATUS, MONOBANK_ERROR_BODY));

      const error = await captureAppError(adapter.chargeStoredCard(makeChargeInput()));
      const exposed = JSON.stringify({ message: error.message, details: error.details });

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.message).toBe("monobank rejected the request");
      expect(error.details).toEqual({
        path: WALLET_PAYMENT_PATH,
        status: BAD_REQUEST_STATUS,
        ...MONOBANK_ERROR_BODY,
      });
      expect(exposed).not.toContain(TEST_MERCHANT_TOKEN);
      expect(exposed).not.toContain(SYNTHETIC_CARD_TOKEN);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("scrubs the merchant token and the card token from errCode and errText", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(BAD_REQUEST_STATUS, {
          errCode: `BAD_${SYNTHETIC_CARD_TOKEN}`,
          errText: `invalid 'cardToken' ${SYNTHETIC_CARD_TOKEN} for ${TEST_MERCHANT_TOKEN}`,
        }),
      );

      const error = await captureAppError(adapter.chargeStoredCard(makeChargeInput()));

      expect(error.details).toEqual({
        path: WALLET_PAYMENT_PATH,
        status: BAD_REQUEST_STATUS,
        errCode: `BAD_${REDACTED}`,
        errText: `invalid 'cardToken' ${REDACTED} for ${REDACTED}`,
      });
    });

    it.each(ECHOED_CARD_TOKENS)(
      "scrubs %s that a DELETE error echoes",
      async (_label, cardToken, echoed) => {
        fetchMock.mockResolvedValueOnce(
          jsonResponse(BAD_REQUEST_STATUS, {
            errCode: ECHO_ERROR_CODE,
            errText: `unknown card ${echoed}`,
          }),
        );

        const error = await captureAppError(adapter.forgetStoredCard(cardToken));

        expect(error.details).toEqual({
          path: WALLET_CARD_PATH,
          status: BAD_REQUEST_STATUS,
          errCode: ECHO_ERROR_CODE,
          errText: `unknown card ${REDACTED}`,
        });
      },
    );

    it("scrubs every occurrence of a secret", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(BAD_REQUEST_STATUS, {
          errCode: ECHO_ERROR_CODE,
          errText: `token ${SYNTHETIC_CARD_TOKEN} invalid (${SYNTHETIC_CARD_TOKEN})`,
        }),
      );

      const error = await captureAppError(adapter.chargeStoredCard(makeChargeInput()));

      expect(error.details).toEqual({
        path: WALLET_PAYMENT_PATH,
        status: BAD_REQUEST_STATUS,
        errCode: ECHO_ERROR_CODE,
        errText: `token ${REDACTED} invalid (${REDACTED})`,
      });
    });

    it("leaves errCode and errText untouched when the merchant token is empty", async () => {
      const emptyTokenAdapter = createMonobankAdapter(
        makeAdapterConfig({ merchantToken: "", fetch: fetchMock }),
      );

      fetchMock.mockResolvedValueOnce(jsonResponse(BAD_REQUEST_STATUS, MONOBANK_ERROR_BODY));

      const error = await captureAppError(emptyTokenAdapter.chargeStoredCard(makeChargeInput()));

      expect(error.details).toEqual({
        path: WALLET_PAYMENT_PATH,
        status: BAD_REQUEST_STATUS,
        ...MONOBANK_ERROR_BODY,
      });
    });

    it.each([
      ["a JSON body of another shape", () => jsonResponse(BAD_REQUEST_STATUS, { error: "bad" })],
      ["a text body", () => textResponse(BAD_REQUEST_STATUS, "Bad Request")],
      ["an empty body", () => emptyResponse(BAD_REQUEST_STATUS)],
    ])("leaves errCode and errText null for %s", async (_label, reply) => {
      fetchMock.mockResolvedValueOnce(reply());

      const error = await captureAppError(adapter.createPurchase(makePurchaseInput()));

      expect(error.details).toEqual({
        path: INVOICE_CREATE_PATH,
        status: BAD_REQUEST_STATUS,
        errCode: null,
        errText: null,
      });
    });

    it("maps a Monobank 401 to InternalServerError, never UnauthorizedError", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(UNAUTHORIZED_STATUS, { errCode: "UNAUTHORIZED", errText: "invalid token" }),
      );

      const error = await captureAppError(adapter.createPurchase(makePurchaseInput()));

      expect(error).toBeInstanceOf(InternalServerError);
      expect(error).not.toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(INTERNAL_SERVER_ERROR_CODE);
    });

    it("surfaces a network failure as BadGatewayError whose details carry the path and never the query", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

      const error = await captureAppError(adapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe("monobank could not be reached");
      expect(error.details).toEqual({ path: WALLET_CARD_PATH });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("surfaces a 2xx body that is not JSON as BadGatewayError with the invalid_json issue", async () => {
      fetchMock.mockResolvedValueOnce(textResponse(OK_STATUS, "<html>ok</html>"));

      const error = await captureAppError(adapter.createPurchase(makePurchaseInput()));

      expect(error).toBeInstanceOf(BadGatewayError);
      expect(error.message).toBe("monobank sent an invoice reply we cannot read");
      expect(error.details).toEqual({ issues: [{ path: "", code: "invalid_json" }] });
    });

    it.each(LEAK_CASES)(
      "keeps the error message and details of %s free of the URL, the tokens and the request",
      async (_name, call, requestFragments) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(BAD_REQUEST_STATUS, MONOBANK_ERROR_BODY));

        const error = await captureAppError(call(adapter));
        const { url, body } = requestOf(fetchMock, 0);
        const exposed = `${error.message} ${JSON.stringify(error.details)}`;
        const forbidden = [
          API_HOST,
          url,
          TEST_MERCHANT_TOKEN,
          SYNTHETIC_CARD_TOKEN,
          ...requestFragments,
          ...(body === undefined ? [] : [body]),
        ];

        for (const fragment of forbidden) {
          expect(exposed).not.toContain(fragment);
        }
      },
    );
  });

  describe("fetch resolution and URL building", () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it("uses globalThis.fetch when no fetch is injected", async () => {
      const globalFetch = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(emptyResponse(OK_STATUS));
      const defaultFetchAdapter = createMonobankAdapter(makeAdapterConfig());

      await expect(
        defaultFetchAdapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN),
      ).resolves.toBeUndefined();

      expect(globalFetch).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("resolves globalThis.fetch on every call, so a fetch swapped in after construction is used", async () => {
      const replacedFetch = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("replaced"));
      const currentFetch = vi.fn<typeof fetch>().mockResolvedValue(emptyResponse(OK_STATUS));

      vi.stubGlobal("fetch", replacedFetch);

      const defaultFetchAdapter = createMonobankAdapter(makeAdapterConfig());

      vi.stubGlobal("fetch", currentFetch);

      await expect(
        defaultFetchAdapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN),
      ).resolves.toBeUndefined();

      expect(currentFetch).toHaveBeenCalledTimes(1);
      expect(replacedFetch).not.toHaveBeenCalled();
    });

    it.each([`${TEST_API_URL}/`, `${TEST_API_URL}//`])(
      "joins the apiUrl %s and the path with one slash",
      async (apiUrl) => {
        fetchMock.mockResolvedValueOnce(emptyResponse(OK_STATUS));

        const slashedAdapter = createMonobankAdapter(
          makeAdapterConfig({ apiUrl, fetch: fetchMock }),
        );

        await slashedAdapter.forgetStoredCard(SYNTHETIC_CARD_TOKEN);

        expect(requestOf(fetchMock, 0).url).toBe(
          `${TEST_API_URL}/api/merchant/wallet/card?cardToken=${SYNTHETIC_CARD_TOKEN}`,
        );
      },
    );
  });
});
