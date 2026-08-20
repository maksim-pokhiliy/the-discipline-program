import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  composeUserName,
  LEGACY_ADMIN_SYNTHETIC_EMAIL,
  type LegacySourceRow,
  legacySourceSchema,
  normalizeLegacySource,
  parseLegacySource,
} from "./legacy-users-import-source";

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: 42,
  username: "athlete@tdp.local",
  password: GOLDEN_BCRYPT_HASH,
  user_role_id: 1,
  training_level_id: 2,
  first_name: null,
  last_name: null,
  phone_number: null,
  date_of_birth: null,
  team_id: null,
  user_plan_id: 1,
  is_enabled: true,
  ...overrides,
});

const onlyRow = (...rows: LegacySourceRow[]) => {
  const parsed = normalizeLegacySource(rows);
  const [first] = parsed.rows;

  if (first === undefined) {
    throw new Error(`expected a normalized row, got defects: ${JSON.stringify(parsed.defects)}`);
  }

  return first;
};

describe("legacySourceSchema", () => {
  it("accepts the shape psql json_agg(row_to_json(u)) emits", () => {
    expect(legacySourceSchema.parse([sourceRow()])).toHaveLength(1);
  });

  it("rejects an unknown column, so a drifted dump fails loudly instead of importing partially", () => {
    const drifted = { ...sourceRow(), nickname: "surprise" };

    expect(() => legacySourceSchema.parse([drifted])).toThrow();
  });

  it("rejects a missing column", () => {
    const incomplete: Record<string, unknown> = { ...sourceRow() };

    delete incomplete.phone_number;

    expect(() => legacySourceSchema.parse([incomplete])).toThrow();
  });

  it("rejects a calendar-invalid date of birth", () => {
    expect(() => legacySourceSchema.parse([sourceRow({ date_of_birth: "2001-02-29" })])).toThrow();
  });

  it("rejects a timestamp where a yyyy-MM-dd date belongs", () => {
    expect(() =>
      legacySourceSchema.parse([sourceRow({ date_of_birth: "2001-02-28T00:00:00.000Z" })]),
    ).toThrow();
  });
});

describe("composeUserName", () => {
  it("joins both parts when both are present", () => {
    expect(composeUserName("Test", "Athlete")).toBe("Test Athlete");
  });

  it("returns the single part when only one is present", () => {
    expect(composeUserName("Test", null)).toBe("Test");
    expect(composeUserName(null, "Athlete")).toBe("Athlete");
  });

  it("returns null when both are absent", () => {
    expect(composeUserName(null, null)).toBeNull();
  });

  it("treats whitespace-only parts as absent", () => {
    expect(composeUserName("   ", "\t")).toBeNull();
  });
});

describe("normalizeLegacySource", () => {
  it("lowercases and trims the username into the platform email", () => {
    expect(onlyRow(sourceRow({ username: "  Athlete@TDP.Local  " })).email).toBe(
      "athlete@tdp.local",
    );
  });

  it("carries the bcrypt hash through byte for byte", () => {
    expect(onlyRow(sourceRow()).passwordHash).toBe(GOLDEN_BCRYPT_HASH);
  });

  it("preserves an empty-string phone number rather than coercing it to null", () => {
    expect(onlyRow(sourceRow({ phone_number: "" })).phoneNumber).toBe("");
  });

  it("preserves a null phone number as null", () => {
    expect(onlyRow(sourceRow({ phone_number: null })).phoneNumber).toBeNull();
  });

  it("mirrors first and last name verbatim while composing a separate display name", () => {
    const row = onlyRow(sourceRow({ first_name: "Test", last_name: "Athlete" }));

    expect(row.firstName).toBe("Test");
    expect(row.lastName).toBe("Athlete");
    expect(row.name).toBe("Test Athlete");
  });

  it("parses the date of birth to UTC midnight, never to a device-local instant", () => {
    const row = onlyRow(sourceRow({ date_of_birth: "1990-05-01" }));

    expect(row.dateOfBirth?.toISOString()).toBe("1990-05-01T00:00:00.000Z");
  });

  it("keeps a null date of birth null", () => {
    expect(onlyRow(sourceRow({ date_of_birth: null })).dateOfBirth).toBeNull();
  });

  it("mirrors the legacy catalog ids without reinterpreting them", () => {
    const row = onlyRow(sourceRow({ user_role_id: 2, user_plan_id: 2, training_level_id: 4 }));

    expect(row.legacyRoleId).toBe(2);
    expect(row.legacyPlanId).toBe(2);
    expect(row.legacyLevelId).toBe(4);
  });

  it("mirrors is_enabled from the dump", () => {
    expect(onlyRow(sourceRow({ is_enabled: false })).isEnabled).toBe(false);
  });

  it("flags a non-null team id, which the identity table has nowhere to keep", () => {
    expect(onlyRow(sourceRow({ team_id: 3 })).hasLegacyTeam).toBe(true);
    expect(onlyRow(sourceRow({ team_id: null })).hasLegacyTeam).toBe(false);
  });

  it("reports a username that is not an email as a defect instead of guessing one", () => {
    const parsed = normalizeLegacySource([sourceRow({ id: 99, username: "root" })]);

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.defects).toEqual([{ kind: "username-not-an-email", legacyUserId: 99 }]);
  });
});

describe("the ratified id-17 override", () => {
  const adminRow = (overrides: Partial<LegacySourceRow> = {}) =>
    sourceRow({ id: 17, username: "admin", user_role_id: 2, is_enabled: true, ...overrides });

  it("remaps the junk username to the synthetic address", () => {
    const row = onlyRow(adminRow());

    expect(row.email).toBe(LEGACY_ADMIN_SYNTHETIC_EMAIL);
    expect(row.isSyntheticEmail).toBe(true);
  });

  it("forces the account disabled even though the dump says enabled", () => {
    expect(onlyRow(adminRow({ is_enabled: true })).isEnabled).toBe(false);
  });

  it("withholds the credential, so the guessable public address cannot be signed into", () => {
    expect(onlyRow(adminRow()).passwordHash).toBeNull();
  });

  it("still mirrors the legacy role, which never becomes a platform privilege", () => {
    expect(onlyRow(adminRow()).legacyRoleId).toBe(2);
  });

  it("refuses to apply itself when the source username no longer matches", () => {
    const parsed = normalizeLegacySource([adminRow({ username: "someone@else.invalid" })]);

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.defects).toEqual([
      { kind: "override-source-mismatch", legacyUserId: 17, expectedUsername: "admin" },
    ]);
  });

  it("does not apply to any other legacy id that happens to be named admin", () => {
    const parsed = normalizeLegacySource([sourceRow({ id: 18, username: "admin" })]);

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.defects).toEqual([{ kind: "username-not-an-email", legacyUserId: 18 }]);
  });
});

describe("parseLegacySource", () => {
  it("validates then normalizes in one step", () => {
    const parsed = parseLegacySource([sourceRow(), sourceRow({ id: 43, username: "b@tdp.local" })]);

    expect(parsed.rows.map((row) => row.legacyUserId)).toEqual([42, 43]);
    expect(parsed.defects).toEqual([]);
  });

  it("throws on a payload that is not an array of rows", () => {
    expect(() => parseLegacySource({ rows: [] })).toThrow();
  });

  it("refuses an empty export, which almost always means the wrong source database", () => {
    expect(() => parseLegacySource([])).toThrow(/holds no rows/);
  });
});
