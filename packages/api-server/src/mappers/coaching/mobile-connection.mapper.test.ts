import { type MobileConnection as PrismaMobileConnection } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { mapToMobileConnection } from "./mobile-connection.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");
const EXPIRES = new Date("2025-07-01T12:00:00Z");

const makeRow = (overrides: Partial<PrismaMobileConnection> = {}): PrismaMobileConnection => ({
  id: "cls_mc_1",
  coachProfileId: "cls_cp_1",
  encryptedToken: "aV5jaXBoZXJ0ZXh0dGFn",
  legacyUserId: "42",
  legacyUserName: "Coach Jane",
  legacyUserRole: "ADMIN",
  expiresAt: EXPIRES,
  createdAt: NOW,
  updatedAt: LATER,
  ...overrides,
});

describe("mapToMobileConnection", () => {
  it("maps the persisted connection to the DTO shape", () => {
    const result = mapToMobileConnection(makeRow());

    expect(result).toEqual({
      id: "cls_mc_1",
      legacyUserId: "42",
      legacyUserName: "Coach Jane",
      legacyUserRole: "ADMIN",
      expiresAt: EXPIRES,
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("never exposes the encrypted token", () => {
    const result = mapToMobileConnection(makeRow());

    expect(result).not.toHaveProperty("encryptedToken");
    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("accessToken");
  });

  it("never exposes the owning coachProfileId", () => {
    const result = mapToMobileConnection(makeRow());

    expect(result).not.toHaveProperty("coachProfileId");
  });

  it("keeps the result token-free regardless of the input token value", () => {
    const result = mapToMobileConnection(makeRow({ encryptedToken: "another-cipher-blob" }));

    expect(Object.values(result)).not.toContain("another-cipher-blob");
  });

  it("has no encryptedToken key at the type level", () => {
    type ResultKeys = keyof ReturnType<typeof mapToMobileConnection>;
    const assertNoToken: "encryptedToken" extends ResultKeys ? never : true = true;

    expect(assertNoToken).toBe(true);
  });
});
