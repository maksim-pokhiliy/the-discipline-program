import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../../test/golden-fixture";

import { readBcryptCost } from "./bcrypt-cost";

const COST_12_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";

describe("readBcryptCost", () => {
  it("reads the cost factor out of a legacy 2a hash", () => {
    expect(readBcryptCost(GOLDEN_BCRYPT_HASH)).toBe(10);
  });

  it("reads the cost factor out of a platform hash", () => {
    expect(readBcryptCost(COST_12_HASH)).toBe(12);
  });

  it("accepts every bcrypt variant prefix", () => {
    expect(readBcryptCost("$2b$11$0123456789012345678901")).toBe(11);
    expect(readBcryptCost("$2y$08$0123456789012345678901")).toBe(8);
  });

  it("returns null for anything that is not a bcrypt hash", () => {
    expect(readBcryptCost("not-a-hash")).toBeNull();
    expect(readBcryptCost("")).toBeNull();
    expect(readBcryptCost("$2a$xx$0123456789012345678901")).toBeNull();
  });

  it("reads a leading cost zero as the number it is, never as an absent one", () => {
    expect(readBcryptCost("$2a$04$0123456789012345678901")).toBe(4);
  });
});
