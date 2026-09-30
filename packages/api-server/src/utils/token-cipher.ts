import crypto from "node:crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const ALGORITHM = "aes-256-gcm";

type TokenCipher = {
  encrypt: (plaintext: string) => string;
  decrypt: (payload: string) => string;
};

type TokenCipherOptions = {
  key: string | undefined;
  name: string;
};

const encryptWithKey = (key: Buffer, plaintext: string): string => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, authTag]).toString("base64");
};

const decryptWithKey = (key: Buffer, payload: string): string => {
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted payload is too short to contain an IV and auth tag");
  }

  const iv = buffer.subarray(0, IV_BYTES);
  const authTag = buffer.subarray(buffer.length - TAG_BYTES);
  const ciphertext = buffer.subarray(IV_BYTES, buffer.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
};

export const createTokenCipher = ({ key, name }: TokenCipherOptions): TokenCipher => {
  const keyBytes = Buffer.from(key ?? "", "base64");

  if (keyBytes.length !== KEY_BYTES) {
    throw new Error(
      `${name} must decode to ${KEY_BYTES} bytes (got ${keyBytes.length}); expected base64 of 32 random bytes`,
    );
  }

  return {
    encrypt: (plaintext) => encryptWithKey(keyBytes, plaintext),
    decrypt: (payload) => decryptWithKey(keyBytes, payload),
  };
};
