import { afterEach, describe, expect, it, vi } from "vitest";

import {
  KEY_DECODING_TO_33_BYTES,
  MOBILE_PUBLISH_KEY_ENV_NAME,
  readTestEnvKey,
} from "../../../test/token-cipher-test-keys";
import { createTokenCipher } from "../../../utils";

import { decryptLegacyToken, encryptLegacyToken } from "./legacy-token-cipher";

const RAW_TOKEN = "raw-legacy-access-token-value";

const mobilePublishTestCipher = createTokenCipher({
  key: readTestEnvKey(MOBILE_PUBLISH_KEY_ENV_NAME),
  name: MOBILE_PUBLISH_KEY_ENV_NAME,
});

describe("legacy-token-cipher", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("opens a token sealed under the mobile-publish test key", () => {
    expect(decryptLegacyToken(mobilePublishTestCipher.encrypt(RAW_TOKEN))).toBe(RAW_TOKEN);
  });

  it("seals without associated data, so a cipher given none under the same key opens it", () => {
    expect(mobilePublishTestCipher.decrypt(encryptLegacyToken(RAW_TOKEN))).toBe(RAW_TOKEN);
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
