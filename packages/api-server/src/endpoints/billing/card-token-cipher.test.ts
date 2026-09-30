import { afterEach, describe, expect, it, vi } from "vitest";

import {
  KEY_DECODING_TO_33_BYTES,
  MOBILE_PUBLISH_KEY_ENV_NAME,
  readTestEnvKey,
} from "../../test/token-cipher-test-keys";
import { createTokenCipher } from "../../utils";

import { decryptCardToken, encryptCardToken } from "./card-token-cipher";

const TAMPER_MASK = 0xff;
const BILLING_KEY_ENV_NAME = "BILLING_ENCRYPTION_KEY";
const SYNTHETIC_CARD_TOKEN = "synthetic-card-token-01";
const SYNTHETIC_USER_ID = "clz00000000000000000usr1";
const OTHER_USER_ID = "clz00000000000000000usr2";

describe("card-token-cipher", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a card token", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);

    expect(decryptCardToken(sealed, SYNTHETIC_USER_ID)).toBe(SYNTHETIC_CARD_TOKEN);
  });

  it("produces distinct ciphertexts for one card token", () => {
    expect(encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID)).not.toBe(
      encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID),
    );
  });

  it("throws on a tampered byte", () => {
    const buffer = Buffer.from(encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID), "base64");
    const lastIndex = buffer.length - 1;

    buffer.writeUInt8(buffer.readUInt8(lastIndex) ^ TAMPER_MASK, lastIndex);

    expect(() => decryptCardToken(buffer.toString("base64"), SYNTHETIC_USER_ID)).toThrow();
  });

  it("never carries the card token in the sealed text or in its decoded bytes", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);

    expect(sealed).not.toContain(SYNTHETIC_CARD_TOKEN);
    expect(Buffer.from(sealed, "base64").includes(Buffer.from(SYNTHETIC_CARD_TOKEN, "utf8"))).toBe(
      false,
    );
  });

  it("does not open a token sealed for one user for another user", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);

    expect(() => decryptCardToken(sealed, OTHER_USER_ID)).toThrow();
  });

  it("opens under the billing test key and not under the mobile-publish test key", () => {
    const billingKey = readTestEnvKey(BILLING_KEY_ENV_NAME);
    const mobilePublishKey = readTestEnvKey(MOBILE_PUBLISH_KEY_ENV_NAME);
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);
    const billingTestCipher = createTokenCipher({ key: billingKey, name: BILLING_KEY_ENV_NAME });
    const mobilePublishTestCipher = createTokenCipher({
      key: mobilePublishKey,
      name: MOBILE_PUBLISH_KEY_ENV_NAME,
    });

    expect(billingKey).not.toBe(mobilePublishKey);
    expect(billingTestCipher.decrypt(sealed, SYNTHETIC_USER_ID)).toBe(SYNTHETIC_CARD_TOKEN);
    expect(() => mobilePublishTestCipher.decrypt(sealed, SYNTHETIC_USER_ID)).toThrow();
  });

  it("binds the token to the user id as associated data", () => {
    const billingTestCipher = createTokenCipher({
      key: readTestEnvKey(BILLING_KEY_ENV_NAME),
      name: BILLING_KEY_ENV_NAME,
    });
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);

    expect(billingTestCipher.decrypt(sealed, SYNTHETIC_USER_ID)).toBe(SYNTHETIC_CARD_TOKEN);
    expect(() => billingTestCipher.decrypt(sealed)).toThrow();
  });

  it("refuses to load when the billing key passes env validation but does not decode to 32 bytes", async () => {
    vi.stubEnv(BILLING_KEY_ENV_NAME, KEY_DECODING_TO_33_BYTES);
    vi.resetModules();

    await expect(import("./card-token-cipher")).rejects.toThrow(
      `${BILLING_KEY_ENV_NAME} must decode to 32 bytes (got 33); expected base64 of 32 random bytes`,
    );
  });
});
