import { describe, expect, it } from "vitest";

import { connectMobileSchema, mobileConnectionSchema } from "./mobile-connection.schema";

const baseEntity = {
  id: "clp9z8x7w0000abcd1234efgh",
  legacyUserId: "42",
  legacyUserName: "Coach Denys",
  legacyUserRole: "COACH",
  expiresAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("mobileConnectionSchema", () => {
  it("accepts a full valid connection", () => {
    const result = mobileConnectionSchema.safeParse(baseEntity);

    expect(result.success).toBe(true);
  });

  it("has no token key on the parsed DTO (G2 security invariant)", () => {
    const result = mobileConnectionSchema.safeParse({
      ...baseEntity,
      token: "leaked-secret",
      encryptedToken: "leaked-secret",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("token");
      expect(result.data).not.toHaveProperty("encryptedToken");
    }
  });

  it("has no token key in the schema shape", () => {
    expect(mobileConnectionSchema.shape).not.toHaveProperty("token");
    expect(mobileConnectionSchema.shape).not.toHaveProperty("encryptedToken");
  });

  it("rejects a non-cuid id", () => {
    const result = mobileConnectionSchema.safeParse({ ...baseEntity, id: "not-a-cuid" });

    expect(result.success).toBe(false);
  });
});

describe("connectMobileSchema", () => {
  it("accepts valid credentials", () => {
    const result = connectMobileSchema.safeParse({
      email: "denys@example.com",
      password: "hunter2",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-email", () => {
    const result = connectMobileSchema.safeParse({ email: "not-an-email", password: "hunter2" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = connectMobileSchema.safeParse({ email: "denys@example.com", password: "" });

    expect(result.success).toBe(false);
  });
});
