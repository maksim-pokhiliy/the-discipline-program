import { describe, expect, it } from "vitest";

import { fingerprintFormData, fingerprintRawBody, sha256Hex } from "../request-fingerprint";

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("sha256Hex", () => {
  it('MT-20 — hashes the empty string to the canonical sha256("") hex', () => {
    expect(sha256Hex("")).toBe(EMPTY_SHA256);
  });

  it("hashes a literal {} body to a deterministic hex digest", () => {
    expect(sha256Hex("{}")).toBe(
      "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
    );
  });

  it("produces identical digests for the same input across calls", () => {
    expect(sha256Hex("payload")).toBe(sha256Hex("payload"));
  });

  it("produces distinct digests for distinct inputs", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });

  it("hashes a Uint8Array equivalently to its decoded text", () => {
    const text = "hello";
    const bytes = new TextEncoder().encode(text);

    expect(sha256Hex(bytes)).toBe(sha256Hex(text));
  });
});

describe("fingerprintRawBody", () => {
  it('MT-20 — hashes an empty body to the canonical sha256("") hex', () => {
    expect(fingerprintRawBody("")).toBe(EMPTY_SHA256);
  });

  it("returns the same fingerprint for repeated identical bodies", () => {
    expect(fingerprintRawBody('{"a":1}')).toBe(fingerprintRawBody('{"a":1}'));
  });
});

describe("fingerprintFormData", () => {
  it('hashes an empty FormData to sha256("[]")', async () => {
    const form = new FormData();

    expect(await fingerprintFormData(form)).toBe(sha256Hex("[]"));
  });

  it("is order-independent over field NAMES (sorts keys before hashing)", async () => {
    const a = new FormData();

    a.append("x", "1");
    a.append("y", "2");

    const b = new FormData();

    b.append("y", "2");
    b.append("x", "1");

    expect(await fingerprintFormData(a)).toBe(await fingerprintFormData(b));
  });

  it("returns a different fingerprint when a text field value changes", async () => {
    const before = new FormData();

    before.append("name", "alice");

    const after = new FormData();

    after.append("name", "bob");

    expect(await fingerprintFormData(before)).not.toBe(await fingerprintFormData(after));
  });

  it("returns a different fingerprint when a file's content changes", async () => {
    const a = new FormData();

    a.append("file", new File([new Uint8Array([1, 2, 3])], "a.bin"));

    const b = new FormData();

    b.append("file", new File([new Uint8Array([4, 5, 6])], "a.bin"));

    expect(await fingerprintFormData(a)).not.toBe(await fingerprintFormData(b));
  });

  it("returns a different fingerprint when a field is added", async () => {
    const small = new FormData();

    small.append("x", "1");

    const big = new FormData();

    big.append("x", "1");
    big.append("y", "2");

    expect(await fingerprintFormData(small)).not.toBe(await fingerprintFormData(big));
  });

  it("preserves insertion order for repeated values under the same field name", async () => {
    const ascending = new FormData();

    ascending.append("tags", "a");
    ascending.append("tags", "b");

    const descending = new FormData();

    descending.append("tags", "b");
    descending.append("tags", "a");

    expect(await fingerprintFormData(ascending)).not.toBe(await fingerprintFormData(descending));
  });
});
