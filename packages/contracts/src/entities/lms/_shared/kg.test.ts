import { describe, expect, it } from "vitest";

import { kgSchema } from "./kg";

const ACCEPTED_KG = [
  142.45, 19.99, 2.45, 1.15, 0.07, 8.05, 16.1, 40.95, 34.02, 100.1, 9999.99, 0.01, 50, 22.5,
];

const REJECTED_KG = [
  100.125,
  0.001,
  0.005,
  9999.999,
  10000,
  9999.991,
  0,
  -5,
  Infinity,
  -Infinity,
  NaN,
];

describe("kgSchema", () => {
  it.each(ACCEPTED_KG)("accepts %p", (kg) => {
    expect(kgSchema.safeParse(kg).success).toBe(true);
  });

  it.each(REJECTED_KG)("rejects %p", (kg) => {
    expect(kgSchema.safeParse(kg).success).toBe(false);
  });

  it("rejects a stringified number (no coercion)", () => {
    expect(kgSchema.safeParse("100").success).toBe(false);
  });
});
