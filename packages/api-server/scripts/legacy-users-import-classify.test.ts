import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import { classifyImport } from "./legacy-users-import-classify";
import type {
  ImportPlan,
  PlatformIdentity,
  PlatformSnapshot,
  PlatformUser,
} from "./legacy-users-import-plan";
import { demangleSoftDeletedEmail } from "./legacy-users-import-snapshot";
import {
  LEGACY_ADMIN_SYNTHETIC_EMAIL,
  type LegacySourceRow,
  normalizeLegacySource,
} from "./legacy-users-import-source";

const COST_12_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";

const LEGACY_ID = 20;
const LEGACY_EMAIL = "athlete@tdp.local";

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: LEGACY_ID,
  username: LEGACY_EMAIL,
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

const platformUser = (overrides: Partial<PlatformUser> = {}): PlatformUser => {
  const base = {
    id: "user_platform",
    email: LEGACY_EMAIL,
    role: "ATHLETE",
    deletedAt: null,
    password: COST_12_HASH,
    identityLegacyUserId: null,
    ...overrides,
  };

  return { ...base, matchEmail: overrides.matchEmail ?? demangleSoftDeletedEmail(base.email) };
};

const storedIdentity = (overrides: Partial<PlatformIdentity> = {}): PlatformIdentity => ({
  legacyUserId: LEGACY_ID,
  userId: "user_platform",
  importedPasswordHash: null,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
  isEnabled: true,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  dateOfBirth: null,
  ...overrides,
});

const emptySnapshot = (overrides: Partial<PlatformSnapshot> = {}): PlatformSnapshot => ({
  identities: [],
  individualLinks: [],
  users: [],
  ...overrides,
});

const classify = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot,
  isCredentialRestoreEnabled = false,
): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot, { isCredentialRestoreEnabled });

const reasons = (plan: ImportPlan): string[] => plan.conflicts.map((conflict) => conflict.reason);
const warningKinds = (plan: ImportPlan): string[] => plan.warnings.map((warning) => warning.kind);

describe("match levels", () => {
  it("creates a user when nothing on the platform matches", () => {
    const plan = classify([sourceRow()], emptySnapshot());

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions.at(0)?.kind).toBe("create");
    expect(plan.conflicts).toEqual([]);
  });

  it("attaches to the athlete an individual publish link names", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_linked" }],
        users: [platformUser({ id: "user_linked", email: "linked@platform.local" })],
      }),
    );
    const [action] = plan.actions;

    expect(action).toMatchObject({ kind: "attach", userId: "user_linked", matchedBy: "link" });
  });

  it("attaches to a user matched by the normalized legacy address", () => {
    const plan = classify([sourceRow()], emptySnapshot({ users: [platformUser()] }));
    const [action] = plan.actions;

    expect(action).toMatchObject({ kind: "attach", userId: "user_platform", matchedBy: "email" });
  });

  it("refreshes when a legacy identity for this id already exists", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity()],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID })],
      }),
    );

    expect(plan.actions.at(0)?.kind).toBe("refresh");
  });
});

describe("match priority", () => {
  it("prefers the stored identity over both a link and an address match", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity({ userId: "user_identity" })],
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_linked" }],
        users: [
          platformUser({ id: "user_identity", email: "identity@platform.local" }),
          platformUser({ id: "user_linked", email: "linked@platform.local" }),
          platformUser({ id: "user_email" }),
        ],
      }),
    );

    expect(plan.actions.at(0)).toMatchObject({ kind: "refresh", userId: "user_identity" });
  });

  it("credits the link when the link and the address name the same user, since it is the stronger evidence", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_platform" }],
        users: [platformUser({ id: "user_platform", email: LEGACY_EMAIL })],
      }),
    );

    expect(plan.actions.at(0)).toMatchObject({ matchedBy: "link", userId: "user_platform" });
  });

  it("attaches by address when no publish link carries the legacy id", () => {
    const plan = classify([sourceRow()], emptySnapshot({ users: [platformUser()] }));

    expect(plan.actions.at(0)).toMatchObject({ matchedBy: "email" });
  });
});

describe("conflicts", () => {
  it("refuses when a link and the address name different platform users", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_linked" }],
        users: [
          platformUser({ id: "user_linked", email: "linked@platform.local" }),
          platformUser({ id: "user_email" }),
        ],
      }),
    );

    expect(reasons(plan)).toEqual(["link-and-email-disagree"]);
    expect(plan.actions).toEqual([]);
  });

  it("refuses when several links carry the legacy id but name different athletes", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [
          { legacyUserId: LEGACY_ID, athleteId: "user_a" },
          { legacyUserId: LEGACY_ID, athleteId: "user_b" },
        ],
        users: [platformUser({ id: "user_a" }), platformUser({ id: "user_b" })],
      }),
    );

    expect(reasons(plan)).toEqual(["ambiguous-link"]);
  });

  it("accepts several links that all name the same athlete", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [
          { legacyUserId: LEGACY_ID, athleteId: "user_a" },
          { legacyUserId: LEGACY_ID, athleteId: "user_a" },
        ],
        users: [platformUser({ id: "user_a", email: LEGACY_EMAIL })],
      }),
    );

    expect(plan.conflicts).toEqual([]);
    expect(plan.actions.at(0)?.kind).toBe("attach");
  });

  it("refuses to attach to a soft-deleted platform user", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_gone" }],
        users: [platformUser({ id: "user_gone", deletedAt: new Date("2026-01-01T00:00:00.000Z") })],
      }),
    );

    expect(reasons(plan)).toEqual(["matched-user-soft-deleted"]);
  });

  it("refuses when the matched user already carries a different legacy id", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({ users: [platformUser({ identityLegacyUserId: 99 })] }),
    );

    expect(reasons(plan)).toEqual(["matched-user-has-other-identity"]);
  });

  it("refuses when two source rows resolve to one platform user, and stages neither", () => {
    const plan = classify(
      [sourceRow({ id: 20 }), sourceRow({ id: 21, username: "second@tdp.local" })],
      emptySnapshot({
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_shared" },
          { legacyUserId: 21, athleteId: "user_shared" },
        ],
        users: [platformUser({ id: "user_shared", email: "shared@platform.local" })],
      }),
    );

    expect(reasons(plan)).toEqual(["platform-user-claimed-twice", "platform-user-claimed-twice"]);
    expect(plan.actions).toEqual([]);
  });

  it("refuses when a stored identity names a platform user that is gone", () => {
    const plan = classify([sourceRow()], emptySnapshot({ identities: [storedIdentity()] }));

    expect(reasons(plan)).toEqual(["identity-user-missing"]);
  });

  it("refuses when a publish link names a platform user that is gone", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({ individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_ghost" }] }),
    );

    expect(reasons(plan)).toEqual(["identity-user-missing"]);
  });

  it("refuses both rows when two of them normalize to the same address", () => {
    const plan = classify(
      [
        sourceRow({ id: 20, username: "same@tdp.local" }),
        sourceRow({ id: 21, username: "SAME@tdp.local" }),
      ],
      emptySnapshot(),
    );

    expect(reasons(plan)).toEqual(["duplicate-email-in-source", "duplicate-email-in-source"]);
    expect(plan.actions).toEqual([]);
  });

  it("refuses a legacy id that appears twice in a hand-edited export", () => {
    const plan = classify(
      [sourceRow({ id: 20 }), sourceRow({ id: 20, username: "other@tdp.local" })],
      emptySnapshot(),
    );

    expect(reasons(plan)).toEqual([
      "duplicate-legacy-id-in-source",
      "duplicate-legacy-id-in-source",
    ]);
  });

  it("surfaces a username that is not an email", () => {
    const plan = classify([sourceRow({ id: 99, username: "root" })], emptySnapshot());

    expect(reasons(plan)).toEqual(["username-not-an-email"]);
  });

  it("surfaces an override whose source row has changed underneath it", () => {
    const plan = classify(
      [sourceRow({ id: 17, username: "someone@else.invalid" })],
      emptySnapshot(),
    );

    expect(reasons(plan)).toEqual(["override-source-mismatch"]);
  });
});

describe("soft-deleted platform users", () => {
  const softDeleted = (email: string) =>
    platformUser({
      id: "user_gone",
      email: `${email}_deleted_1750000000000`,
      matchEmail: email,
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

  it("refuses to resurrect a soft-deleted platform user as a fresh create", () => {
    const plan = classify([sourceRow()], emptySnapshot({ users: [softDeleted(LEGACY_EMAIL)] }));

    expect(reasons(plan)).toEqual(["matched-user-soft-deleted"]);
    expect(plan.actions).toEqual([]);
  });

  it("still attaches to the live user when a soft-deleted namesake also exists", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        users: [softDeleted(LEGACY_EMAIL), platformUser({ id: "user_live" })],
      }),
    );

    expect(plan.conflicts).toEqual([]);
    expect(plan.actions.at(0)).toMatchObject({ kind: "attach", userId: "user_live" });
  });

  it("refuses a refresh whose stored identity now sits on a soft-deleted user", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity()],
        users: [
          platformUser({
            id: "user_platform",
            deletedAt: new Date("2026-01-01T00:00:00.000Z"),
            identityLegacyUserId: LEGACY_ID,
          }),
        ],
      }),
    );

    expect(reasons(plan)).toEqual(["matched-user-soft-deleted"]);
    expect(plan.actions).toEqual([]);
  });
});

describe("AS-10 catalog validation", () => {
  it("refuses an out-of-range role, plan or level", () => {
    for (const overrides of [{ user_role_id: 3 }, { user_plan_id: 3 }, { training_level_id: 5 }]) {
      const plan = classify([sourceRow(overrides)], emptySnapshot());

      expect(reasons(plan)).toEqual(["catalog-id-out-of-range"]);
      expect(plan.actions).toEqual([]);
    }
  });

  it("checks the catalog before any match level, so a bad id can never be refreshed in", () => {
    const plan = classify(
      [sourceRow({ training_level_id: 9 })],
      emptySnapshot({
        identities: [storedIdentity()],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID })],
      }),
    );

    expect(reasons(plan)).toEqual(["catalog-id-out-of-range"]);
    expect(plan.actions).toEqual([]);
  });
});

describe("warnings", () => {
  it("flags a link match whose platform address differs, because the app login changes", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_linked" }],
        users: [platformUser({ id: "user_linked", email: "new.address@platform.local" })],
      }),
    );
    const warning = plan.warnings.find((entry) => entry.kind === "login-address-changes");

    expect(warning?.detail).toContain("new.address@platform.local");
    expect(warning?.detail).toContain(LEGACY_EMAIL);
  });

  it("does not flag an address change when the link names the same address", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_linked" }],
        users: [platformUser({ id: "user_linked", email: LEGACY_EMAIL })],
      }),
    );

    expect(warningKinds(plan)).not.toContain("login-address-changes");
  });

  it("flags a matched user who has no password, since the legacy one is not carried over", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({ users: [platformUser({ password: null })] }),
    );

    expect(warningKinds(plan)).toContain("matched-user-has-no-credential");
  });

  it("does not flag a matched user who already has a platform password", () => {
    const plan = classify([sourceRow()], emptySnapshot({ users: [platformUser()] }));

    expect(warningKinds(plan)).not.toContain("matched-user-has-no-credential");
  });

  it("flags a matched user whose platform role is not athlete", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({ users: [platformUser({ role: "COACH" })] }),
    );

    expect(warningKinds(plan)).toContain("matched-user-is-not-an-athlete");
  });

  it("flags a refresh that leaves a credential no marker vouches for alone", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity()],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID, password: COST_12_HASH })],
      }),
    );

    expect(warningKinds(plan)).toContain("password-left-as-is");
  });

  it("does not flag a refresh whose stored hash already equals the source hash", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity()],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID, password: GOLDEN_BCRYPT_HASH })],
      }),
    );

    expect(warningKinds(plan)).not.toContain("password-left-as-is");
  });

  it("flags a stored identity the legacy address no longer names", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity({ userId: "user_identity" })],
        users: [
          platformUser({ id: "user_identity", email: "identity@platform.local" }),
          platformUser({ id: "user_other" }),
        ],
      }),
    );

    expect(warningKinds(plan)).toContain("identity-target-drift");
    expect(reasons(plan)).not.toContain("link-and-identity-disagree");
    expect(plan.actions.at(0)).toMatchObject({ kind: "refresh", userId: "user_identity" });
  });

  it("surfaces a link that names another user as a conflict and not as drift", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity({ userId: "user_identity" })],
        individualLinks: [{ legacyUserId: LEGACY_ID, athleteId: "user_other" }],
        users: [
          platformUser({ id: "user_identity" }),
          platformUser({ id: "user_other", email: "other@platform.local" }),
        ],
      }),
    );

    expect(reasons(plan)).toContain("link-and-identity-disagree");
    expect(warningKinds(plan)).not.toContain("identity-target-drift");
  });

  it("flags the synthetic junk account as credential-less", () => {
    const plan = classify([sourceRow({ id: 17, username: "admin" })], emptySnapshot());

    expect(warningKinds(plan)).toContain("synthetic-email-no-credential");
  });

  it("flags a legacy team the identity table cannot keep", () => {
    const plan = classify([sourceRow({ team_id: 4 })], emptySnapshot());

    expect(warningKinds(plan)).toContain("legacy-team-dropped");
  });

  it("reports an identity missing from this export without planning a delete", () => {
    const plan = classify(
      [sourceRow()],
      emptySnapshot({
        identities: [storedIdentity(), storedIdentity({ legacyUserId: 7, userId: "user_seven" })],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID })],
      }),
    );
    const warning = plan.warnings.find((entry) => entry.kind === "identity-absent-from-source");

    expect(warning?.legacyUserId).toBe(7);
    expect(plan.actions.every((action) => action.row.legacyUserId === LEGACY_ID)).toBe(true);
  });
});

describe("credential outcomes on a refresh", () => {
  const DRIFTED_HASH = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";

  const refreshSnapshotWith = (password: string | null, marker: string | null = null) =>
    emptySnapshot({
      identities: [storedIdentity({ importedPasswordHash: marker })],
      users: [platformUser({ identityLegacyUserId: LEGACY_ID, password })],
    });

  it("reports a credential-less matched user honestly instead of claiming one is managed", () => {
    const plan = classify([sourceRow()], refreshSnapshotWith(null));

    expect(warningKinds(plan)).toContain("matched-user-has-no-credential");
    expect(warningKinds(plan)).not.toContain("password-left-as-is");
  });

  it("says plainly when the credential it wrote differs and was left alone", () => {
    const plan = classify([sourceRow()], refreshSnapshotWith(DRIFTED_HASH, DRIFTED_HASH));

    expect(warningKinds(plan)).toContain("credential-differs-not-restored");
  });

  it("warns loudly when it is about to replace a stored credential", () => {
    const plan = classify([sourceRow()], refreshSnapshotWith(DRIFTED_HASH, DRIFTED_HASH), true);

    expect(warningKinds(plan)).toContain("credential-restored");
  });

  it("declines to restore over a credential it cannot prove it wrote", () => {
    const plan = classify([sourceRow()], refreshSnapshotWith(DRIFTED_HASH), true);

    expect(warningKinds(plan)).toContain("password-left-as-is");
    expect(warningKinds(plan)).not.toContain("credential-restored");
  });

  it("stays silent when the stored credential already matches the export", () => {
    const plan = classify(
      [sourceRow()],
      refreshSnapshotWith(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH),
    );

    expect(warningKinds(plan)).not.toContain("credential-restored");
    expect(warningKinds(plan)).not.toContain("password-left-as-is");
  });

  it("says nothing at all about a credential the export deliberately withholds", () => {
    const plan = classify(
      [sourceRow({ id: 17, username: "admin" })],
      emptySnapshot({
        identities: [storedIdentity({ legacyUserId: 17 })],
        users: [
          platformUser({
            email: LEGACY_ADMIN_SYNTHETIC_EMAIL,
            matchEmail: LEGACY_ADMIN_SYNTHETIC_EMAIL,
            identityLegacyUserId: 17,
            password: COST_12_HASH,
          }),
        ],
      }),
      true,
    );

    expect(plan.actions.at(0)).toMatchObject({
      kind: "refresh",
      credentialOutcome: { kind: "left-as-is", reason: "no-source-credential" },
    });
    expect(warningKinds(plan)).not.toContain("password-left-as-is");
    expect(warningKinds(plan)).not.toContain("credential-differs-not-restored");
    expect(warningKinds(plan)).not.toContain("credential-restored");
    expect(warningKinds(plan)).not.toContain("matched-user-has-no-credential");
  });

  it("records the marker without a word of warning when it can see what it wrote", () => {
    const plan = classify([sourceRow()], refreshSnapshotWith(GOLDEN_BCRYPT_HASH));

    expect(plan.warnings).toEqual([]);
    expect(plan.actions.at(0)).toMatchObject({
      credentialOutcome: { kind: "marker-backfilled", markerHash: GOLDEN_BCRYPT_HASH },
    });
  });
});

describe("duplicate detection across defect rows", () => {
  it("does not stage an action for a legacy id that also appears as a defect row", () => {
    const plan = classify(
      [sourceRow({ id: 2, username: "root" }), sourceRow({ id: 2, username: "u2@tdp.local" })],
      emptySnapshot(),
    );

    expect(plan.actions).toEqual([]);
    expect(reasons(plan)).toContain("duplicate-legacy-id-in-source");
  });
});

describe("the demo athlete", () => {
  it("is never touched, because its legacy id is outside the imported range", () => {
    const plan = classify([sourceRow()], emptySnapshot());

    expect(plan.actions.map((action) => action.row.legacyUserId)).toEqual([LEGACY_ID]);
    expect(plan.actions.map((action) => action.row.legacyUserId)).not.toContain(990001);
  });

  it("is defended by the identity check even when a source row shares its address", () => {
    const plan = classify(
      [sourceRow({ username: "demo-athlete@thedisciplineprogram.com" })],
      emptySnapshot({
        users: [
          platformUser({
            id: "user_demo",
            email: "demo-athlete@thedisciplineprogram.com",
            identityLegacyUserId: 990001,
          }),
        ],
      }),
    );

    expect(reasons(plan)).toEqual(["matched-user-has-other-identity"]);
    expect(plan.actions).toEqual([]);
  });
});

describe("refresh detail", () => {
  it("carries the mirror diff and a restore decision for an untouched legacy credential", () => {
    const drifted = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";
    const plan = classify(
      [sourceRow({ training_level_id: 4, is_enabled: false })],
      emptySnapshot({
        identities: [storedIdentity({ importedPasswordHash: drifted })],
        users: [platformUser({ identityLegacyUserId: LEGACY_ID, password: drifted })],
      }),
      true,
    );
    const [action] = plan.actions;

    if (action?.kind !== "refresh") {
      throw new Error("expected a refresh action");
    }

    expect(action.identityChanges.map((change) => change.field)).toEqual([
      "legacyLevelId",
      "isEnabled",
    ]);
    expect(action.credentialOutcome).toMatchObject({ kind: "restored" });
  });
});
