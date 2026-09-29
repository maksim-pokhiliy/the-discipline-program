import { billingEnv } from "@repo/env/billing";

import { createTokenCipher } from "../../utils";

const cardTokenCipher = createTokenCipher({
  key: billingEnv.BILLING_ENCRYPTION_KEY,
  name: "BILLING_ENCRYPTION_KEY",
});

export const encryptCardToken = cardTokenCipher.encrypt;
export const decryptCardToken = cardTokenCipher.decrypt;
