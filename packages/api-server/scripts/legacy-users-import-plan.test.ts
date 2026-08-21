import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  decideCredentialOutcome,
  describeUnmappedCatalogIds,
  diffIdentity,
  type PlatformIdentity,
} from "./legacy-users-import-plan";
import { normalizeLegacySource } from "./legacy-users-import-source";

const COST_12_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";
const OTHER_COST_10_HASH = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";

const rowWith = (overrides: Record<string, unknown> = {}) => {
  const parsed = normalizeLegacySource([
    {
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
    },
  ]);
  const [row] = parsed.rows;

  if (row === undefined) {
    throw new Error("fixture failed to normalize");
  }

  return row;
};

describe("describeUnmappedCatalogIds", () => {
  it("accepts every id the legacy catalogs actually list", () => {
    for (const roleId of [1, 2]) {
      expect(describeUnmappedCatalogIds(rowWith({ user_role_id: roleId }))).toBeNull();
    }

    for (const planId of [1, 2]) {
      expect(describeUnmappedCatalogIds(rowWith({ user_plan_id: planId }))).toBeNull();
    }

    for (const levelId of [1, 2, 3, 4]) {
      expect(describeUnmappedCatalogIds(rowWith({ training_level_id: levelId }))).toBeNull();
    }
  });

  it("rejects a role id past the catalog", () => {
    expect(describeUnmappedCatalogIds(rowWith({ user_role_id: 3 }))).toContain("role id 3");
  });

  it("rejects a plan id past the catalog", () => {
    expect(describeUnmappedCatalogIds(rowWith({ user_plan_id: 3 }))).toContain("plan id 3");
  });

  it("rejects a level id past the catalog", () => {
    expect(describeUnmappedCatalogIds(rowWith({ training_level_id: 5 }))).toContain("level id 5");
  });

  it("rejects a zero id, which no catalog uses", () => {
    expect(describeUnmappedCatalogIds(rowWith({ user_role_id: 0 }))).toContain("role id 0");
  });

  it("names every unmapped id at once rather than only the first", () => {
    const detail = describeUnmappedCatalogIds(
      rowWith({ user_role_id: 9, user_plan_id: 9, training_level_id: 9 }),
    );

    expect(detail).toContain("role id 9");
    expect(detail).toContain("plan id 9");
    expect(detail).toContain("level id 9");
  });
});

describe("diffIdentity", () => {
  const stored: PlatformIdentity = {
    legacyUserId: 42,
    userId: "user_42",
    importedPasswordHash: null,
    legacyRoleId: 1,
    legacyPlanId: 1,
    legacyLevelId: 2,
    isEnabled: true,
    firstName: null,
    lastName: null,
    phoneNumber: null,
    dateOfBirth: null,
  };

  it("reports nothing when the mirror already matches the source", () => {
    expect(diffIdentity(stored, rowWith())).toEqual([]);
  });

  it("reports a training level move, the drift that would serve wrong content", () => {
    expect(diffIdentity(stored, rowWith({ training_level_id: 3 }))).toEqual([
      { field: "legacyLevelId", from: "2", to: "3" },
    ]);
  });

  it("reports a plan move between the general and individual channels", () => {
    expect(diffIdentity(stored, rowWith({ user_plan_id: 2 }))).toEqual([
      { field: "legacyPlanId", from: "1", to: "2" },
    ]);
  });

  it("reports an enablement change", () => {
    expect(diffIdentity(stored, rowWith({ is_enabled: false }))).toEqual([
      { field: "isEnabled", from: "true", to: "false" },
    ]);
  });

  it("treats an empty-string phone number as different from a null one", () => {
    expect(diffIdentity(stored, rowWith({ phone_number: "" }))).toEqual([
      { field: "phoneNumber", from: "(none)", to: '""' },
    ]);
  });

  it('does not confuse the literal string "null" with an absent value', () => {
    const withLiteral = { ...stored, phoneNumber: "null" };

    expect(diffIdentity(withLiteral, rowWith({ phone_number: null }))).toEqual([
      { field: "phoneNumber", from: '"null"', to: "(none)" },
    ]);
  });

  it("compares dates as calendar days, not as instants", () => {
    const withDate: PlatformIdentity = {
      ...stored,
      dateOfBirth: new Date("1990-05-01T00:00:00.000Z"),
    };

    expect(diffIdentity(withDate, rowWith({ date_of_birth: "1990-05-01" }))).toEqual([]);
    expect(diffIdentity(withDate, rowWith({ date_of_birth: "1990-05-02" }))).toEqual([
      { field: "dateOfBirth", from: "1990-05-01", to: "1990-05-02" },
    ]);
  });

  it("reports several fields at once", () => {
    const changes = diffIdentity(
      stored,
      rowWith({
        training_level_id: 4,
        is_enabled: false,
        first_name: "Test",
        last_name: "Athlete",
      }),
    );

    expect(changes.map((change) => change.field)).toEqual([
      "legacyLevelId",
      "isEnabled",
      "firstName",
      "lastName",
    ]);
  });
});

describe("decideCredentialOutcome", () => {
  const RESTORE_ON = true;
  const RESTORE_OFF = false;

  const decide = (
    storedHash: string | null,
    sourceHash: string | null,
    markerHash: string | null,
    isCredentialRestoreEnabled = RESTORE_OFF,
  ) => decideCredentialOutcome({ storedHash, sourceHash, markerHash, isCredentialRestoreEnabled });

  it("never nulls out a stored credential when the source withholds one", () => {
    expect(decide(COST_12_HASH, null, COST_12_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "no-source-credential",
    });
  });

  it("never hands a credential to a platform user that has none", () => {
    expect(decide(null, GOLDEN_BCRYPT_HASH, null, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "matched-user-has-none",
    });
  });

  it("records the marker when the stored credential already is the export hash", () => {
    expect(decide(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH, null)).toEqual({
      kind: "marker-backfilled",
      markerHash: GOLDEN_BCRYPT_HASH,
    });
  });

  it("writes nothing when the marker already records the credential in place", () => {
    expect(decide(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH)).toEqual({
      kind: "unchanged",
    });
  });

  it("leaves a marker that disagrees with a credential the export happens to match", () => {
    expect(decide(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH)).toEqual({
      kind: "unchanged",
    });
  });

  it("declines to touch a credential no marker vouches for", () => {
    expect(decide(OTHER_COST_10_HASH, GOLDEN_BCRYPT_HASH, null, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "not-import-written",
    });
  });

  it("declines when the credential moved away from the one this import wrote", () => {
    expect(decide(COST_12_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "not-import-written",
    });
  });

  it("declines for an athlete whose first sign-in re-hashed the credential this import wrote", () => {
    expect(decide(COST_12_HASH, GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "not-import-written",
    });
  });

  it("refuses to replace even a marked credential by default", () => {
    expect(decide(OTHER_COST_10_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH, RESTORE_OFF)).toEqual(
      { kind: "left-as-is", reason: "restore-not-enabled" },
    );
  });

  it("replaces a marked credential, and the marker with it, when restore is enabled", () => {
    expect(decide(OTHER_COST_10_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH, RESTORE_ON)).toEqual({
      kind: "restored",
      expectedStoredHash: OTHER_COST_10_HASH,
      nextHash: GOLDEN_BCRYPT_HASH,
    });
  });

  it("reads no meaning at all out of the bcrypt cost factor", () => {
    expect(decide(COST_12_HASH, GOLDEN_BCRYPT_HASH, COST_12_HASH, RESTORE_ON)).toEqual({
      kind: "restored",
      expectedStoredHash: COST_12_HASH,
      nextHash: GOLDEN_BCRYPT_HASH,
    });
    expect(decide("garbage", GOLDEN_BCRYPT_HASH, "garbage", RESTORE_ON)).toEqual({
      kind: "restored",
      expectedStoredHash: "garbage",
      nextHash: GOLDEN_BCRYPT_HASH,
    });
  });
});
