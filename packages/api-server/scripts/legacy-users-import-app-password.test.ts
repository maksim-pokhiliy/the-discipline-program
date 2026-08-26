import { describe, expect, it } from "vitest";

import { COST_12_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH } from "../src/test/golden-fixture";

import {
  appPasswordChangeFor,
  type AppPasswordSubject,
  isAppPasswordPlatformChosen,
  reconstructMatchedBy,
} from "./legacy-users-import-app-password";
import { classifyImport } from "./legacy-users-import-classify";
import { buildIndexes, type Indexes } from "./legacy-users-import-match";
import type { ImportPlan, PlatformSnapshot, PlatformUser } from "./legacy-users-import-plan";
import {
  type LegacySourceRow,
  type NormalizedLegacyUser,
  normalizeLegacySource,
} from "./legacy-users-import-source";

const LEGACY_ID = 20;
const LEGACY_ADDRESS = "athlete@tdp.local";
const PLATFORM_USER_ID = "user_platform";

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: LEGACY_ID,
  username: LEGACY_ADDRESS,
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

const platformUser = (overrides: Partial<PlatformUser> = {}): PlatformUser => ({
  id: PLATFORM_USER_ID,
  email: LEGACY_ADDRESS,
  matchEmail: LEGACY_ADDRESS,
  role: "ATHLETE",
  deletedAt: null,
  password: OTHER_COST_10_HASH,
  identityLegacyUserId: null,
  ...overrides,
});

const emptySnapshot = (overrides: Partial<PlatformSnapshot> = {}): PlatformSnapshot => ({
  identities: [],
  individualLinks: [],
  users: [],
  ...overrides,
});

const normalizedRow = (overrides: Partial<LegacySourceRow> = {}): NormalizedLegacyUser => {
  const [row] = normalizeLegacySource([sourceRow(overrides)]).rows;

  if (row === undefined) {
    throw new Error("the fixture row did not normalize");
  }

  return row;
};

const subjectOf = (overrides: Partial<AppPasswordSubject> = {}): AppPasswordSubject => ({
  row: normalizedRow(),
  user: platformUser(),
  markerHash: null,
  ...overrides,
});

const indexesOf = (snapshot: PlatformSnapshot = emptySnapshot()): Indexes => buildIndexes(snapshot);

const planFor = (rows: LegacySourceRow[], snapshot: PlatformSnapshot): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot);

describe("isAppPasswordPlatformChosen", () => {
  it("holds when the stored credential differs from the export and carries no marker", () => {
    expect(isAppPasswordPlatformChosen(subjectOf())).toBe(true);
  });

  it("does not hold when the export withheld the credential", () => {
    expect(
      isAppPasswordPlatformChosen(subjectOf({ row: { ...normalizedRow(), passwordHash: null } })),
    ).toBe(false);
  });

  it("does not hold when the stored credential already is the export hash", () => {
    expect(
      isAppPasswordPlatformChosen(
        subjectOf({ user: platformUser({ password: GOLDEN_BCRYPT_HASH }) }),
      ),
    ).toBe(false);
  });

  it("does not hold when the person carries no platform credential at all", () => {
    expect(isAppPasswordPlatformChosen(subjectOf({ user: platformUser({ password: null }) }))).toBe(
      false,
    );
  });

  it("does not hold when a marker records that the import wrote the credential", () => {
    expect(isAppPasswordPlatformChosen(subjectOf({ markerHash: GOLDEN_BCRYPT_HASH }))).toBe(false);
  });

  it("does not hold when a marker is set but no longer matches, since that is unknowable", () => {
    expect(
      isAppPasswordPlatformChosen(
        subjectOf({
          user: platformUser({ password: COST_12_HASH }),
          markerHash: GOLDEN_BCRYPT_HASH,
        }),
      ),
    ).toBe(false);
  });

  it("does not hold when there is no matched platform user", () => {
    expect(isAppPasswordPlatformChosen(subjectOf({ user: undefined }))).toBe(false);
  });
});

describe("reconstructMatchedBy", () => {
  const row = normalizedRow();

  it("reads link when an individual publish link names the same platform user", () => {
    const indexes = indexesOf(
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: PLATFORM_USER_ID }],
        users: [
          platformUser({ email: "moved@platform.local", matchEmail: "moved@platform.local" }),
        ],
      }),
    );

    expect(reconstructMatchedBy(row, PLATFORM_USER_ID, indexes)).toBe("link");
  });

  it("reads email when only the address points at that user", () => {
    const indexes = indexesOf(emptySnapshot({ users: [platformUser()] }));

    expect(reconstructMatchedBy(row, PLATFORM_USER_ID, indexes)).toBe("email");
  });

  it("reads null when neither route names that user any more", () => {
    const indexes = indexesOf(emptySnapshot());

    expect(reconstructMatchedBy(row, PLATFORM_USER_ID, indexes)).toBeNull();
  });
});

describe("appPasswordChangeFor", () => {
  it("mirrors the export's enablement, because that is what the identity will hold", () => {
    const change = appPasswordChangeFor(
      subjectOf({ row: normalizedRow({ is_enabled: false }) }),
      indexesOf(emptySnapshot({ users: [platformUser()] })),
    );

    expect(change).toEqual({
      legacyUserId: LEGACY_ID,
      userEmail: LEGACY_ADDRESS,
      matchedBy: "email",
      isEnabled: false,
    });
  });
});

describe("classifyImport app password changes", () => {
  it("lists an attach whose platform user chose their own password", () => {
    const plan = planFor([sourceRow()], emptySnapshot({ users: [platformUser()] }));

    expect(plan.appPasswordChanges).toEqual([
      { legacyUserId: LEGACY_ID, userEmail: LEGACY_ADDRESS, matchedBy: "email", isEnabled: true },
    ]);
  });

  it("still lists them on the next run, when the row comes back as a refresh", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        users: [platformUser()],
        identities: [
          {
            legacyUserId: LEGACY_ID,
            userId: PLATFORM_USER_ID,
            importedPasswordHash: null,
            legacyRoleId: 1,
            legacyPlanId: 1,
            legacyLevelId: 2,
            isEnabled: true,
            firstName: null,
            lastName: null,
            phoneNumber: null,
            dateOfBirth: null,
          },
        ],
      }),
    );

    expect(plan.actions.map((action) => action.kind)).toEqual(["refresh"]);
    expect(plan.appPasswordChanges.map((change) => change.legacyUserId)).toEqual([LEGACY_ID]);
  });

  it("leaves out a refresh whose marker is set but no longer matches", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({
        users: [platformUser({ password: COST_12_HASH })],
        identities: [
          {
            legacyUserId: LEGACY_ID,
            userId: PLATFORM_USER_ID,
            importedPasswordHash: GOLDEN_BCRYPT_HASH,
            legacyRoleId: 1,
            legacyPlanId: 1,
            legacyLevelId: 2,
            isEnabled: true,
            firstName: null,
            lastName: null,
            phoneNumber: null,
            dateOfBirth: null,
          },
        ],
      }),
    );

    expect(plan.appPasswordChanges).toEqual([]);
    expect(plan.warnings.map((warning) => warning.kind)).toContain("password-left-as-is");
  });

  it("leaves out a create, which is written with the export hash", () => {
    const plan = planFor([sourceRow()], emptySnapshot());

    expect(plan.actions.map((action) => action.kind)).toEqual(["create"]);
    expect(plan.appPasswordChanges).toEqual([]);
  });

  it("leaves out a platform user with no password of their own", () => {
    const plan = planFor(
      [sourceRow()],
      emptySnapshot({ users: [platformUser({ password: null })] }),
    );

    expect(plan.appPasswordChanges).toEqual([]);
    expect(plan.warnings.map((warning) => warning.kind)).toContain(
      "matched-user-has-no-credential",
    );
  });

  it("drops a change whose action was withdrawn by a claim collision", () => {
    const plan = planFor(
      [sourceRow(), sourceRow({ id: 21, username: "other@tdp.local" })],
      emptySnapshot({
        individualLinks: [
          { legacyUserId: LEGACY_ID, athleteId: PLATFORM_USER_ID },
          { legacyUserId: 21, athleteId: PLATFORM_USER_ID },
        ],
        users: [platformUser()],
      }),
    );

    expect(plan.conflicts.map((conflict) => conflict.reason)).toContain(
      "platform-user-claimed-twice",
    );
    expect(plan.actions).toEqual([]);
    expect(plan.appPasswordChanges).toEqual([]);
  });
});
