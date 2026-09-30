import { describe, expect, it } from "vitest";

import { createTokenCipher } from "./token-cipher";

const KEY_BYTES = 32;
const SHORT_KEY_BYTES = 16;
const TEST_KEY_FILL = 0x2a;
const OTHER_KEY_FILL = 0x2b;
const TEST_KEY_NAME = "TEST_KEY";
const OTHER_KEY_NAME = "OTHER_KEY";
const TEST_KEY = Buffer.alloc(KEY_BYTES, TEST_KEY_FILL).toString("base64");
const OTHER_KEY = Buffer.alloc(KEY_BYTES, OTHER_KEY_FILL).toString("base64");
const SHORT_KEY = Buffer.alloc(SHORT_KEY_BYTES, TEST_KEY_FILL).toString("base64");

const JWT_LIKE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiQURNSU4ifQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const KNOWN_ANSWER_PLAINTEXT = "synthetic-kat-token-ключ-01";
const KNOWN_ANSWER_PAYLOAD =
  "9M5Xf60UPsiAu/rgz7InClaa4nrsg8QBu4WkqtN2N57FWnN3tqGXt/kTifx7dOPXamQS6AR+JDuA3us=";

const cipher = createTokenCipher({ key: TEST_KEY, name: TEST_KEY_NAME });

describe("createTokenCipher", () => {
  it("round-trips an ASCII string", () => {
    const plaintext = "hello-legacy-access-token";

    expect(cipher.decrypt(cipher.encrypt(plaintext))).toBe(plaintext);
  });

  it("round-trips a unicode string", () => {
    const plaintext = "токен-доступа-日本語-🔐";

    expect(cipher.decrypt(cipher.encrypt(plaintext))).toBe(plaintext);
  });

  it("round-trips a realistic JWT-length string", () => {
    expect(cipher.decrypt(cipher.encrypt(JWT_LIKE))).toBe(JWT_LIKE);
  });

  it("produces a different ciphertext for the same plaintext on each call", () => {
    const plaintext = "same-input";

    expect(cipher.encrypt(plaintext)).not.toBe(cipher.encrypt(plaintext));
  });

  it("throws when a byte of the payload is tampered", () => {
    const wire = cipher.encrypt("tamper-me");
    const buffer = Buffer.from(wire, "base64");
    const lastIndex = buffer.length - 1;

    buffer.writeUInt8(buffer.readUInt8(lastIndex) ^ 0xff, lastIndex);
    const tampered = buffer.toString("base64");

    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it("throws when the ciphertext region is mutated", () => {
    const wire = cipher.encrypt("mutate-the-middle");
    const buffer = Buffer.from(wire, "base64");
    const middle = Math.floor(buffer.length / 2);

    buffer.writeUInt8(buffer.readUInt8(middle) ^ 0x01, middle);

    expect(() => cipher.decrypt(buffer.toString("base64"))).toThrow();
  });

  it("throws on an empty payload", () => {
    expect(() => cipher.decrypt("")).toThrow();
  });

  it("throws on a too-short payload", () => {
    const tooShort = Buffer.alloc(8, 1).toString("base64");

    expect(() => cipher.decrypt(tooShort)).toThrow();
  });

  it("refuses a key that does not decode to 32 bytes and names it", () => {
    expect(() => createTokenCipher({ key: SHORT_KEY, name: TEST_KEY_NAME })).toThrow(
      "TEST_KEY must decode to 32 bytes (got 16); expected base64 of 32 random bytes",
    );
  });

  it("refuses an absent key and names it", () => {
    expect(() => createTokenCipher({ key: undefined, name: TEST_KEY_NAME })).toThrow(
      "TEST_KEY must decode to 32 bytes (got 0)",
    );
  });

  it("keeps each cipher's key to itself", () => {
    const other = createTokenCipher({ key: OTHER_KEY, name: OTHER_KEY_NAME });
    const plaintext = "sealed-under-the-test-key";
    const sealed = cipher.encrypt(plaintext);

    expect(cipher.decrypt(sealed)).toBe(plaintext);
    expect(() => other.decrypt(sealed)).toThrow();
  });

  it("opens a known payload that the pre-factory cipher sealed under the same key", () => {
    expect(cipher.decrypt(KNOWN_ANSWER_PAYLOAD)).toBe(KNOWN_ANSWER_PLAINTEXT);
  });
});
