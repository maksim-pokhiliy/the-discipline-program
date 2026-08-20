import { describe, expect, it } from "vitest";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  decidePasswordChange,
  describeUnmappedCatalogIds,
  diffIdentity,
  type PlatformIdentity,
  PLATFORM_BCRYPT_COST,
  readBcryptCost,
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

describe("PLATFORM_BCRYPT_COST", () => {
  it("tracks the constant every platform password write actually uses", () => {
    expect(PLATFORM_BCRYPT_COST).toBe(AUTH_CONSTANTS.BCRYPT_COST_FACTOR);
  });
});

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
});

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
      { field: "phoneNumber", from: "null", to: "" },
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

describe("decidePasswordChange", () => {
  const RESTORE_ON = true;
  const RESTORE_OFF = false;

  it("replaces a drifted below-cost credential only when restore is explicitly enabled", () => {
    expect(decidePasswordChange(OTHER_COST_10_HASH, GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "restored",
    });
  });

  it("refuses to replace a drifted below-cost credential by default", () => {
    expect(decidePasswordChange(OTHER_COST_10_HASH, GOLDEN_BCRYPT_HASH, RESTORE_OFF)).toEqual({
      kind: "left-as-is",
      reason: "restore-not-enabled",
    });
  });

  it("writes nothing when the stored hash already equals the source hash", () => {
    expect(decidePasswordChange(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "unchanged",
    });
  });

  it("leaves a platform-managed cost-12 hash alone even with restore enabled", () => {
    expect(decidePasswordChange(COST_12_HASH, GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "platform-managed",
    });
  });

  it("leaves an unreadable stored hash alone rather than guessing", () => {
    expect(decidePasswordChange("garbage", GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "platform-managed",
    });
  });

  it("never hands a credential to a platform user that has none", () => {
    expect(decidePasswordChange(null, GOLDEN_BCRYPT_HASH, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "matched-user-has-none",
    });
  });

  it("never nulls out a stored credential when the source withholds one", () => {
    expect(decidePasswordChange(COST_12_HASH, null, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "no-source-credential",
    });
    expect(decidePasswordChange(GOLDEN_BCRYPT_HASH, null, RESTORE_ON)).toEqual({
      kind: "left-as-is",
      reason: "no-source-credential",
    });
  });
});
