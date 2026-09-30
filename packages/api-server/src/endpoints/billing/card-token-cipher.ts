import { billingEnv } from "@repo/env/billing";

import { createTokenCipher } from "../../utils";

const cardTokenCipher = createTokenCipher({
  key: billingEnv.BILLING_ENCRYPTION_KEY,
  name: "BILLING_ENCRYPTION_KEY",
});

export const encryptCardToken = (cardToken: string, userId: string): string =>
  cardTokenCipher.encrypt(cardToken, userId);

export const decryptCardToken = (payload: string, userId: string): string =>
  cardTokenCipher.decrypt(payload, userId);
