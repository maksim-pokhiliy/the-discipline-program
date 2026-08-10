import { describe, expect, it } from "vitest";

import {
  changePasswordRequestSchema,
  isValidIsoDate,
  newPasswordPolicySchema,
  parseLegacyDate,
  serializeLegacyDate,
  updateUserRequestSchema,
  userIdParamSchema,
} from "./wire-schemas";

describe("isValidIsoDate", () => {
  it("accepts a real calendar date", () => {
    expect(isValidIsoDate("2000-10-20")).toBe(true);
  });

  it("rejects a rollover date that no calendar has", () => {
    expect(isValidIsoDate("2000-13-40")).toBe(false);
  });

  it("rejects a calendar rollover the naive parser would silently shift", () => {
    expect(isValidIsoDate("2000-02-30")).toBe(false);
    expect(isValidIsoDate("2001-02-29")).toBe(false);
    expect(isValidIsoDate("2000-04-31")).toBe(false);
  });

  it("rejects a non-date string", () => {
    expect(isValidIsoDate("abc")).toBe(false);
  });

  it("rejects a full iso timestamp because the wire format is date-only", () => {
    expect(isValidIsoDate("2000-10-20T00:00:00.000Z")).toBe(false);
  });
});

describe("serializeLegacyDate", () => {
  it("renders a stored date as the ten-character legacy wire format", () => {
    expect(serializeLegacyDate(new Date("2000-10-20T00:00:00.000Z"))).toBe("2000-10-20");
  });

  it("renders null as null", () => {
    expect(serializeLegacyDate(null)).toBeNull();
  });
});

describe("parseLegacyDate", () => {
  it("parses the legacy wire format to utc midnight", () => {
    const parsed = parseLegacyDate("2000-10-20");

    expect(parsed?.toISOString()).toBe("2000-10-20T00:00:00.000Z");
  });

  it("parses null as null", () => {
    expect(parseLegacyDate(null)).toBeNull();
  });

  it("round-trips a date without loss", () => {
    expect(serializeLegacyDate(parseLegacyDate("2000-10-20"))).toBe("2000-10-20");
  });

  it("round-trips a new-year-boundary date with no west-of-utc off-by-one", () => {
    expect(serializeLegacyDate(parseLegacyDate("2000-01-01"))).toBe("2000-01-01");
  });
});

describe("userIdParamSchema", () => {
  it("coerces a numeric string path segment to an integer", () => {
    expect(userIdParamSchema.parse({ id: "1001" })).toEqual({ id: 1001 });
  });

  it("rejects a non-numeric id", () => {
    expect(userIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
  });

  it("rejects a fractional id", () => {
    expect(userIdParamSchema.safeParse({ id: "10.5" }).success).toBe(false);
  });
});

describe("updateUserRequestSchema", () => {
  it("strips privilege fields the legacy body still carries", () => {
    const parsed = updateUserRequestSchema.parse({
      id: 1001,
      firstName: "A",
      lastName: "B",
      phoneNumber: "555",
      dateOfBirth: "1990-05-01",
      userRole: { id: 2, name: "ADMIN" },
      isEnabled: false,
      trainingLevel: { id: 1, name: "Scaled" },
      userPlan: { id: 2, name: "Individual" },
      username: "hacker@evil.local",
    });

    expect(parsed).toEqual({
      id: 1001,
      firstName: "A",
      lastName: "B",
      phoneNumber: "555",
      dateOfBirth: "1990-05-01",
    });
  });

  it("normalizes absent editable fields to null", () => {
    expect(updateUserRequestSchema.parse({ id: 1001 })).toEqual({
      id: 1001,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      dateOfBirth: null,
    });
  });

  it("rejects a malformed date of birth", () => {
    expect(updateUserRequestSchema.safeParse({ id: 1001, dateOfBirth: "not-a-date" }).success).toBe(
      false,
    );
  });

  it("rejects a calendar-rollover date of birth", () => {
    expect(updateUserRequestSchema.safeParse({ id: 1001, dateOfBirth: "2000-02-30" }).success).toBe(
      false,
    );
  });

  it("rejects a profile field carrying a NUL byte instead of letting it reach the database", () => {
    expect(
      updateUserRequestSchema.safeParse({ id: 1001, firstName: `A${String.fromCharCode(0)}B` })
        .success,
    ).toBe(false);
  });

  it("rejects an over-length profile field", () => {
    expect(
      updateUserRequestSchema.safeParse({ id: 1001, firstName: "a".repeat(256) }).success,
    ).toBe(false);
  });
});

describe("newPasswordPolicySchema", () => {
  it("rejects a password below the platform minimum length", () => {
    expect(newPasswordPolicySchema.safeParse("Admin123!").success).toBe(false);
  });

  it("accepts a password that meets the platform minimum length", () => {
    expect(newPasswordPolicySchema.safeParse("NewPassw0rd!23").success).toBe(true);
  });
});

describe("changePasswordRequestSchema", () => {
  it("accepts the legacy change-password body", () => {
    expect(
      changePasswordRequestSchema.safeParse({
        userId: 1001,
        oldPassword: "old",
        newPassword: "new",
      }).success,
    ).toBe(true);
  });

  it("rejects a body missing a field", () => {
    expect(
      changePasswordRequestSchema.safeParse({ userId: 1001, oldPassword: "old" }).success,
    ).toBe(false);
  });
});
