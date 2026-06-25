import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import { contentHash, sha256Hex, stableStringify } from "./hash";

const KEY_HASH_LENGTH = 12;

describe("sha256Hex", () => {
  it("matches the known vector for 'abc'", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("equals the inline crypto expression used by the deduped token sites", () => {
    const input = "some-plain-token-value";

    expect(sha256Hex(input)).toBe(crypto.createHash("sha256").update(input).digest("hex"));
  });

  it("equals the sliced inline expression used by the idempotency store", () => {
    const key = "idempotency-key-fingerprint-source";

    expect(sha256Hex(key).slice(0, KEY_HASH_LENGTH)).toBe(
      crypto.createHash("sha256").update(key).digest("hex").slice(0, KEY_HASH_LENGTH),
    );
  });
});

describe("stableStringify", () => {
  it("sorts object keys deterministically", () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }));
  });

  it("preserves array order", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it("sorts keys recursively in nested objects", () => {
    expect(stableStringify({ outer: { z: 1, a: 2 } })).toBe('{"outer":{"a":2,"z":1}}');
  });
});

describe("contentHash", () => {
  it("is independent of object key order", () => {
    expect(contentHash({ a: 1, b: 2 })).toBe(contentHash({ b: 2, a: 1 }));
  });

  it("is sensitive to array order", () => {
    expect(contentHash([1, 2])).not.toBe(contentHash([2, 1]));
  });
});
