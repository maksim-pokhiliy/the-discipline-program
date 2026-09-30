import crypto from "node:crypto";

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const ALGORITHM = "aes-256-gcm";

type TokenCipher = {
  encrypt: (plaintext: string, associatedData?: string) => string;
  decrypt: (payload: string, associatedData?: string) => string;
};

type TokenCipherOptions = {
  key: string | undefined;
  name: string;
};

const encryptWithKey = (
  key: Buffer,
  plaintext: string,
  associatedData: string | undefined,
): string => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  if (associatedData !== undefined) {
    cipher.setAAD(Buffer.from(associatedData, "utf8"));
  }

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, authTag]).toString("base64");
};

const decryptWithKey = (
  key: Buffer,
  payload: string,
  associatedData: string | undefined,
): string => {
  const buffer = Buffer.from(payload, "base64");

  if (buffer.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted payload is too short to contain an IV and auth tag");
  }

  const iv = buffer.subarray(0, IV_BYTES);
  const authTag = buffer.subarray(buffer.length - TAG_BYTES);
  const ciphertext = buffer.subarray(IV_BYTES, buffer.length - TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  if (associatedData !== undefined) {
    decipher.setAAD(Buffer.from(associatedData, "utf8"));
  }

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
    encrypt: (plaintext, associatedData) => encryptWithKey(keyBytes, plaintext, associatedData),
    decrypt: (payload, associatedData) => decryptWithKey(keyBytes, payload, associatedData),
  };
};
