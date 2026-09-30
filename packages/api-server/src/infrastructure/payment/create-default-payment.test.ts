import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  emptyResponse,
  jsonResponse,
  OK_STATUS,
  readTestPublicKeyValue,
  readWebhookCapture,
  requestOf,
  SYNTHETIC_CARD_TOKEN,
  TEST_API_URL,
  TEST_MERCHANT_TOKEN,
  WALLET_CARD_PATH,
} from "./__fixtures__/monobank-fixtures";
import { createDefaultPayment } from "./create-default-payment";

const success = readWebhookCapture("success");
const testKey = readTestPublicKeyValue();

const UNPINNED_ENV = {
  MONOBANK_API_URL: TEST_API_URL,
  MONOBANK_MERCHANT_TOKEN: TEST_MERCHANT_TOKEN,
};

describe("createDefaultPayment", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the configured merchant token to the configured API URL", async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(OK_STATUS));

    await createDefaultPayment(UNPINNED_ENV).forgetStoredCard(SYNTHETIC_CARD_TOKEN);

    const request = requestOf(fetchMock, 0);

    expect(request.url).toBe(
      `${TEST_API_URL}${WALLET_CARD_PATH}?cardToken=${SYNTHETIC_CARD_TOKEN}`,
    );
    expect(request.headers).toEqual({ "X-Token": TEST_MERCHANT_TOKEN });
  });

  it("verifies a webhook with the configured public key and fetches no key", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(OK_STATUS, { key: testKey }));

    const payment = createDefaultPayment({ ...UNPINNED_ENV, MONOBANK_WEBHOOK_PUBLIC_KEY: testKey });

    await expect(payment.verifyWebhook(success)).resolves.toBe(true);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the key when no public key is configured", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(OK_STATUS, { key: testKey }));

    await expect(createDefaultPayment(UNPINNED_ENV).verifyWebhook(success)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
