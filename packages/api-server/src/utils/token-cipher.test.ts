import { describe, expect, it } from "vitest";

import { decrypt, encrypt } from "./token-cipher";

const JWT_LIKE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiQURNSU4ifQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("token-cipher", () => {
  it("round-trips an ASCII string", () => {
    const plaintext = "hello-legacy-access-token";

    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("round-trips a unicode string", () => {
    const plaintext = "токен-доступа-日本語-🔐";

    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("round-trips a realistic JWT-length string", () => {
    expect(decrypt(encrypt(JWT_LIKE))).toBe(JWT_LIKE);
  });

  it("produces a different ciphertext for the same plaintext on each call", () => {
    const plaintext = "same-input";

    expect(encrypt(plaintext)).not.toBe(encrypt(plaintext));
  });

  it("throws when a byte of the payload is tampered", () => {
    const wire = encrypt("tamper-me");
    const buffer = Buffer.from(wire, "base64");
    const lastIndex = buffer.length - 1;

    buffer.writeUInt8(buffer.readUInt8(lastIndex) ^ 0xff, lastIndex);
    const tampered = buffer.toString("base64");

    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws when the ciphertext region is mutated", () => {
    const wire = encrypt("mutate-the-middle");
    const buffer = Buffer.from(wire, "base64");
    const middle = Math.floor(buffer.length / 2);

    buffer.writeUInt8(buffer.readUInt8(middle) ^ 0x01, middle);

    expect(() => decrypt(buffer.toString("base64"))).toThrow();
  });

  it("throws on an empty payload", () => {
    expect(() => decrypt("")).toThrow();
  });

  it("throws on a too-short payload", () => {
    const tooShort = Buffer.alloc(8, 1).toString("base64");

    expect(() => decrypt(tooShort)).toThrow();
  });
});
