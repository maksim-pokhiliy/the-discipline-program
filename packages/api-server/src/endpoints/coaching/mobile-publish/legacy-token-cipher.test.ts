import { describe, expect, it } from "vitest";

import { createTokenCipher } from "../../../utils";

import { decryptLegacyToken, encryptLegacyToken } from "./legacy-token-cipher";

const KEY_BYTES = 32;
const MOBILE_PUBLISH_TEST_KEY_FILL = 0x07;
const MOBILE_PUBLISH_TEST_KEY = Buffer.alloc(KEY_BYTES, MOBILE_PUBLISH_TEST_KEY_FILL).toString(
  "base64",
);
const RAW_TOKEN = "raw-legacy-access-token-value";

describe("legacy-token-cipher", () => {
  it("opens a token sealed under the mobile-publish test key", () => {
    const mobilePublishTestCipher = createTokenCipher({
      key: MOBILE_PUBLISH_TEST_KEY,
      name: "MOBILE_PUBLISH_TEST_KEY",
    });

    expect(decryptLegacyToken(mobilePublishTestCipher.encrypt(RAW_TOKEN))).toBe(RAW_TOKEN);
  });

  it("round-trips a token", () => {
    expect(decryptLegacyToken(encryptLegacyToken(RAW_TOKEN))).toBe(RAW_TOKEN);
  });
});
