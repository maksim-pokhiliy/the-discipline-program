import { mobilePublishEnv } from "@repo/env/mobile-publish";

import { createTokenCipher } from "../../../utils";

const legacyTokenCipher = createTokenCipher({
  key: mobilePublishEnv.MOBILE_PUBLISH_ENCRYPTION_KEY,
  name: "MOBILE_PUBLISH_ENCRYPTION_KEY",
});

export const encryptLegacyToken = legacyTokenCipher.encrypt;
export const decryptLegacyToken = legacyTokenCipher.decrypt;
