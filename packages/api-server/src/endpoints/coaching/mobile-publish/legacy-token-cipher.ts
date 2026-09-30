import { mobilePublishEnv } from "@repo/env/mobile-publish";

import { createTokenCipher } from "../../../utils";

const legacyTokenCipher = createTokenCipher({
  key: mobilePublishEnv.MOBILE_PUBLISH_ENCRYPTION_KEY,
  name: "MOBILE_PUBLISH_ENCRYPTION_KEY",
});

export const encryptLegacyToken = (plaintext: string): string =>
  legacyTokenCipher.encrypt(plaintext);

export const decryptLegacyToken = (payload: string): string => legacyTokenCipher.decrypt(payload);
