import crypto from "node:crypto";

import { mobilePublishEnv } from "@repo/env/mobile-publish";

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const ALGORITHM = "aes-256-gcm";

const KEY = Buffer.from(mobilePublishEnv.MOBILE_PUBLISH_ENCRYPTION_KEY, "base64");

if (KEY.length !== KEY_BYTES) {
  throw new Error(
    `MOBILE_PUBLISH_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${KEY.length}); expected base64 of 32 random bytes`,
  );
}

export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, authTag]).toString("base64");
};

export const decrypt = (payload: string): string => {
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted payload is too short to contain an IV and auth tag");
  }

  const iv = buffer.subarray(0, IV_BYTES);
  const authTag = buffer.subarray(buffer.length - TAG_BYTES);
  const ciphertext = buffer.subarray(IV_BYTES, buffer.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
};
