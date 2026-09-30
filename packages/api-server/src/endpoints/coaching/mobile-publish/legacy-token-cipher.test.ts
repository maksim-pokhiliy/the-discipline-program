import { afterEach, describe, expect, it, vi } from "vitest";

import { createTokenCipher } from "../../../utils";

import { decryptLegacyToken, encryptLegacyToken } from "./legacy-token-cipher";

const KEY_BYTES = 32;
const MOBILE_PUBLISH_TEST_KEY_FILL = 0x07;
const ENV_KEY_LENGTH = 44;
const MOBILE_PUBLISH_TEST_KEY = Buffer.alloc(KEY_BYTES, MOBILE_PUBLISH_TEST_KEY_FILL).toString(
  "base64",
);
const KEY_DECODING_TO_33_BYTES = "A".repeat(ENV_KEY_LENGTH);
const MOBILE_PUBLISH_KEY_ENV_NAME = "MOBILE_PUBLISH_ENCRYPTION_KEY";
const RAW_TOKEN = "raw-legacy-access-token-value";

describe("legacy-token-cipher", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("refuses to load when the mobile-publish key passes env validation but does not decode to 32 bytes", async () => {
    vi.stubEnv(MOBILE_PUBLISH_KEY_ENV_NAME, KEY_DECODING_TO_33_BYTES);
    vi.resetModules();

    await expect(import("./legacy-token-cipher")).rejects.toThrow(
      `${MOBILE_PUBLISH_KEY_ENV_NAME} must decode to 32 bytes (got 33); expected base64 of 32 random bytes`,
    );
  });
});
