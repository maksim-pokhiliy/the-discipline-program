import { describe, expect, it } from "vitest";

import { planOverridePayloadSchema } from "./plan-override.schema";

describe("planOverridePayloadSchema (discriminated union)", () => {
  it("accepts NOTE { kind, markdown }", () => {
    const result = planOverridePayloadSchema.safeParse({
      kind: "NOTE",
      markdown: "Hello",
    });

    expect(result.success).toBe(true);
  });

  it("accepts SUSPEND { kind } (no extra fields)", () => {
    const result = planOverridePayloadSchema.safeParse({ kind: "SUSPEND" });

    expect(result.success).toBe(true);
  });

  it("rejects APPEND with empty entries (min 1)", () => {
    const result = planOverridePayloadSchema.safeParse({
      kind: "APPEND",
      entries: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects NOTE markdown over 10_000 chars", () => {
    const result = planOverridePayloadSchema.safeParse({
      kind: "NOTE",
      markdown: "x".repeat(10_001),
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown kind", () => {
    const result = planOverridePayloadSchema.safeParse({ kind: "INVALID", payload: {} });

    expect(result.success).toBe(false);
  });

  it("rejects REPLACE without snapshot", () => {
    const result = planOverridePayloadSchema.safeParse({ kind: "REPLACE" });

    expect(result.success).toBe(false);
  });
});
