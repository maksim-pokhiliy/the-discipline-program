import { afterEach, describe, expect, it, vi } from "vitest";

import { createTokenCipher } from "../../utils";

import { decryptCardToken, encryptCardToken } from "./card-token-cipher";

const KEY_BYTES = 32;
const BILLING_TEST_KEY_FILL = 0x0b;
const MOBILE_PUBLISH_TEST_KEY_FILL = 0x07;
const TAMPER_MASK = 0xff;
const ENV_KEY_LENGTH = 44;
const BILLING_TEST_KEY = Buffer.alloc(KEY_BYTES, BILLING_TEST_KEY_FILL).toString("base64");
const MOBILE_PUBLISH_TEST_KEY = Buffer.alloc(KEY_BYTES, MOBILE_PUBLISH_TEST_KEY_FILL).toString(
  "base64",
);
const KEY_DECODING_TO_33_BYTES = "A".repeat(ENV_KEY_LENGTH);
const BILLING_KEY_ENV_NAME = "BILLING_ENCRYPTION_KEY";
const SYNTHETIC_CARD_TOKEN = "synthetic-card-token-01";
const SYNTHETIC_USER_ID = "clz00000000000000000usr1";

describe("card-token-cipher", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a card token", () => {
    expect(
      decryptCardToken(
        encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID),
        SYNTHETIC_USER_ID,
      ),
    ).toBe(SYNTHETIC_CARD_TOKEN);
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

  it("opens under the billing test key and not under the mobile-publish test key", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN, SYNTHETIC_USER_ID);
    const billingTestCipher = createTokenCipher({
      key: BILLING_TEST_KEY,
      name: "BILLING_TEST_KEY",
    });
    const mobilePublishTestCipher = createTokenCipher({
      key: MOBILE_PUBLISH_TEST_KEY,
      name: "MOBILE_PUBLISH_TEST_KEY",
    });

    expect(billingTestCipher.decrypt(sealed, SYNTHETIC_USER_ID)).toBe(SYNTHETIC_CARD_TOKEN);
    expect(() => mobilePublishTestCipher.decrypt(sealed, SYNTHETIC_USER_ID)).toThrow();
  });

  it("refuses to load when the billing key passes env validation but does not decode to 32 bytes", async () => {
    vi.stubEnv(BILLING_KEY_ENV_NAME, KEY_DECODING_TO_33_BYTES);
    vi.resetModules();

    await expect(import("./card-token-cipher")).rejects.toThrow(
      `${BILLING_KEY_ENV_NAME} must decode to 32 bytes (got 33); expected base64 of 32 random bytes`,
    );
  });
});
