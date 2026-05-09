import { describe, expect, it } from "vitest";

import { INT4_MAX, orderFieldSchema } from "./order.schema";

describe("orderFieldSchema", () => {
  it("accepts non-negative integers up to INT4_MAX", () => {
    expect(orderFieldSchema.parse(0)).toBe(0);
    expect(orderFieldSchema.parse(INT4_MAX)).toBe(INT4_MAX);
  });

  it("rejects values above INT4_MAX", () => {
    const result = orderFieldSchema.safeParse(INT4_MAX + 1);

    expect(result.success).toBe(false);
  });

  it("rejects negative values", () => {
    const result = orderFieldSchema.safeParse(-1);

    expect(result.success).toBe(false);
  });

  it("rejects non-integers", () => {
    const result = orderFieldSchema.safeParse(1.5);

    expect(result.success).toBe(false);
  });
});
