import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import { classifyImport } from "./legacy-users-import-classify";
import { canonicalizePlan, planDigest } from "./legacy-users-import-digest";
import type { ImportPlan, PlatformSnapshot } from "./legacy-users-import-plan";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";
import { PLAN_DIGEST_LENGTH } from "./script-target-guard";

const OTHER_COST_10_HASH = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";
const LEGACY_ID = 20;

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: LEGACY_ID,
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

const emptySnapshot = (overrides: Partial<PlatformSnapshot> = {}): PlatformSnapshot => ({
  identities: [],
  individualLinks: [],
  users: [],
  ...overrides,
});

const platformUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user_platform",
  email: "athlete@tdp.local",
  matchEmail: "athlete@tdp.local",
  role: "ATHLETE",
  deletedAt: null,
  password: null,
  identityLegacyUserId: null,
  ...overrides,
});

const storedIdentity = (overrides: Record<string, unknown> = {}) => ({
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

const planFor = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot = emptySnapshot(),
  isCredentialRestoreEnabled = false,
): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot, { isCredentialRestoreEnabled });

const digestOf = (
  rows: LegacySourceRow[],
  snapshot?: PlatformSnapshot,
  isCredentialRestoreEnabled?: boolean,
): string => planDigest(planFor(rows, snapshot, isCredentialRestoreEnabled));

const THREE_ROWS = [
  sourceRow({ id: 21, username: "a@tdp.local" }),
  sourceRow({ id: 22, username: "b@tdp.local" }),
  sourceRow({ id: 23, username: "c@tdp.local" }),
];

describe("planDigest — shape", () => {
  it("is twelve lower-case hexadecimal characters", () => {
    const digest = digestOf([sourceRow()]);

    expect(digest).toHaveLength(PLAN_DIGEST_LENGTH);
    expect(digest).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is stable across runs over the same plan", () => {
    expect(digestOf([sourceRow()])).toBe(digestOf([sourceRow()]));
  });
});

describe("planDigest — insensitivity", () => {
  it("ignores the order rows happen to sit in inside the export", () => {
    const reversed = [...THREE_ROWS].reverse();
    const rotated = [...THREE_ROWS.slice(1), ...THREE_ROWS.slice(0, 1)];

    expect(digestOf(reversed)).toBe(digestOf(THREE_ROWS));
    expect(digestOf(rotated)).toBe(digestOf(THREE_ROWS));
  });

  it("ignores publish links that carry no legacy identity of their own", () => {
    const withExtraLinks = emptySnapshot({
      individualLinks: [{ legacyUserId: 987, athleteId: "user_unimported" }],
    });

    expect(digestOf([sourceRow()], withExtraLinks)).toBe(digestOf([sourceRow()]));
  });
});

describe("planDigest — sensitivity", () => {
  it("changes when a credential in the export changes", () => {
    expect(digestOf([sourceRow({ password: OTHER_COST_10_HASH })])).not.toBe(
      digestOf([sourceRow()]),
    );
  });

  it("changes when a mirrored field changes", () => {
    expect(digestOf([sourceRow({ training_level_id: 4 })])).not.toBe(digestOf([sourceRow()]));
  });

  it("changes when a row moves from a create to an attach", () => {
    const attaching = emptySnapshot({ users: [platformUser()] });

    expect(digestOf([sourceRow()], attaching)).not.toBe(digestOf([sourceRow()]));
  });

  it("changes when a row gains a conflict", () => {
    expect(digestOf([sourceRow({ training_level_id: 9 })])).not.toBe(digestOf([sourceRow()]));
  });

  it("changes when a row gains a warning", () => {
    expect(digestOf([sourceRow({ team_id: 4 })])).not.toBe(digestOf([sourceRow()]));
  });

  it("changes when the credential decision changes under the same rows", () => {
    const drifted = emptySnapshot({
      identities: [storedIdentity({ importedPasswordHash: OTHER_COST_10_HASH })],
      users: [platformUser({ password: OTHER_COST_10_HASH, identityLegacyUserId: LEGACY_ID })],
    });

    expect(digestOf([sourceRow()], drifted, true)).not.toBe(
      digestOf([sourceRow()], drifted, false),
    );
  });

  it("changes when a stored identity outside the export appears", () => {
    const withStranger = emptySnapshot({
      identities: [storedIdentity({ legacyUserId: 77, userId: "user_stranger" })],
    });

    expect(digestOf([sourceRow()], withStranger)).not.toBe(digestOf([sourceRow()]));
  });
});

describe("canonicalizePlan", () => {
  it("sorts every list, so nothing about the plan depends on iteration order", () => {
    const canonical = canonicalizePlan(
      planFor([
        sourceRow({ id: 23, username: "c@tdp.local" }),
        sourceRow({ id: 21, username: "a@tdp.local" }),
        sourceRow({ id: 22, username: "b@tdp.local" }),
      ]),
    );

    expect([...canonical.actions]).toEqual([...canonical.actions].sort());
  });

  it("carries no credential material at all, only fingerprints of it", () => {
    const canonical = canonicalizePlan(
      planFor([sourceRow()], emptySnapshot({ users: [platformUser()] })),
    );
    const serialized = JSON.stringify(canonical);

    expect(serialized).not.toContain(GOLDEN_BCRYPT_HASH);
    expect(serialized).not.toContain("$2a$");
  });

  it("still tells two different credentials apart through their fingerprints", () => {
    const one = JSON.stringify(canonicalizePlan(planFor([sourceRow()])));
    const other = JSON.stringify(
      canonicalizePlan(planFor([sourceRow({ password: OTHER_COST_10_HASH })])),
    );

    expect(one).not.toBe(other);
  });
});
