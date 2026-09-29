import { describe, expect, it } from "vitest";

import { createTokenCipher } from "../../utils";

import { decryptCardToken, encryptCardToken } from "./card-token-cipher";

const KEY_BYTES = 32;
const BILLING_TEST_KEY_FILL = 0x0b;
const MOBILE_PUBLISH_TEST_KEY_FILL = 0x07;
const TAMPER_MASK = 0xff;
const BILLING_TEST_KEY = Buffer.alloc(KEY_BYTES, BILLING_TEST_KEY_FILL).toString("base64");
const MOBILE_PUBLISH_TEST_KEY = Buffer.alloc(KEY_BYTES, MOBILE_PUBLISH_TEST_KEY_FILL).toString(
  "base64",
);
const SYNTHETIC_CARD_TOKEN = "synthetic-card-token-01";

describe("card-token-cipher", () => {
  it("round-trips a card token", () => {
    expect(decryptCardToken(encryptCardToken(SYNTHETIC_CARD_TOKEN))).toBe(SYNTHETIC_CARD_TOKEN);
  });

  it("produces distinct ciphertexts for one card token", () => {
    expect(encryptCardToken(SYNTHETIC_CARD_TOKEN)).not.toBe(encryptCardToken(SYNTHETIC_CARD_TOKEN));
  });

  it("throws on a tampered byte", () => {
    const buffer = Buffer.from(encryptCardToken(SYNTHETIC_CARD_TOKEN), "base64");
    const lastIndex = buffer.length - 1;

    buffer.writeUInt8(buffer.readUInt8(lastIndex) ^ TAMPER_MASK, lastIndex);

    expect(() => decryptCardToken(buffer.toString("base64"))).toThrow();
  });

  it("never contains the card token or its base64", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN);

    expect(sealed).not.toContain(SYNTHETIC_CARD_TOKEN);
    expect(sealed).not.toContain(Buffer.from(SYNTHETIC_CARD_TOKEN, "utf8").toString("base64"));
  });

  it("opens under the billing test key and not under the mobile-publish test key", () => {
    const sealed = encryptCardToken(SYNTHETIC_CARD_TOKEN);
    const billingTestCipher = createTokenCipher({
      key: BILLING_TEST_KEY,
      name: "BILLING_TEST_KEY",
    });
    const mobilePublishTestCipher = createTokenCipher({
      key: MOBILE_PUBLISH_TEST_KEY,
      name: "MOBILE_PUBLISH_TEST_KEY",
    });

    expect(billingTestCipher.decrypt(sealed)).toBe(SYNTHETIC_CARD_TOKEN);
    expect(() => mobilePublishTestCipher.decrypt(sealed)).toThrow();
  });
});
