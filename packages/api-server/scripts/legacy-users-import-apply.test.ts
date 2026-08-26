import { describe, expect, it } from "vitest";

import { COST_12_HASH, GOLDEN_BCRYPT_HASH, OTHER_COST_10_HASH } from "../src/test/golden-fixture";

import { applyImport, ImportConflictError, type ImportWriter } from "./legacy-users-import-apply";
import { classifyImport } from "./legacy-users-import-classify";
import type { ImportPlan, PlatformSnapshot } from "./legacy-users-import-plan";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";

const LEGACY_ID = 20;

type Call = { path: string; args: unknown };

const fakeWriter = () => {
  const calls: Call[] = [];
  const record = (path: string) => (args: unknown) => {
    calls.push({ path, args });

    return Promise.resolve({ id: `created_${calls.length}` });
  };
  const forbid = (path: string) => () => {
    throw new Error(`apply reached for ${path}, which it must never do`);
  };

  const writer = {
    user: {
      create: record("user.create"),
      update: record("user.update"),
      delete: forbid("user.delete"),
      deleteMany: forbid("user.deleteMany"),
    },
    mobileLegacyIdentity: {
      create: record("identity.create"),
      update: record("identity.update"),
      delete: forbid("identity.delete"),
      deleteMany: forbid("identity.deleteMany"),
    },
  };

  return { writer: writer as unknown as ImportWriter, calls };
};

const paths = (calls: Call[]): string[] => calls.map((call) => call.path);

const argsAt = (calls: Call[], path: string): Record<string, unknown> => {
  const call = calls.find((candidate) => candidate.path === path);

  if (call === undefined) {
    throw new Error(`no ${path} call was recorded; recorded: ${paths(calls).join(", ")}`);
  }

  return call.args as Record<string, unknown>;
};

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

const planFor = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot,
  isCredentialRestoreEnabled = false,
): ImportPlan =>
  classifyImport(normalizeLegacySource(rows), snapshot, { isCredentialRestoreEnabled });

const storedIdentity = (overrides = {}) => ({
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

describe("applyImport — create", () => {
  it("writes one user and one identity", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor([sourceRow({ first_name: "Test", last_name: "Athlete" })], emptySnapshot()),
    );

    expect(paths(calls)).toEqual(["user.create", "identity.create"]);
  });

  it("records the credential it wrote on the identity it created", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], emptySnapshot()));

    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: { importedPasswordHash: GOLDEN_BCRYPT_HASH },
    });
  });

  it("carries the legacy hash into the new user byte for byte", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], emptySnapshot()));

    expect(argsAt(calls, "user.create")).toMatchObject({
      data: { email: "athlete@tdp.local", password: GOLDEN_BCRYPT_HASH },
    });
  });

  it("always writes the platform role as athlete, even for a legacy admin row", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow({ user_role_id: 2 })], emptySnapshot()));

    expect(argsAt(calls, "user.create")).toMatchObject({ data: { role: "ATHLETE" } });
    expect(argsAt(calls, "identity.create")).toMatchObject({ data: { legacyRoleId: 2 } });
  });

  it("writes a null name when the legacy row carries neither name part", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], emptySnapshot()));

    expect(argsAt(calls, "user.create")).toMatchObject({ data: { name: null } });
  });

  it("mirrors every legacy field onto the identity, keeping an empty phone empty", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor(
        [
          sourceRow({
            phone_number: "",
            date_of_birth: "1990-05-01",
            user_plan_id: 2,
            training_level_id: 4,
            is_enabled: false,
          }),
        ],
        emptySnapshot(),
      ),
    );

    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: {
        legacyUserId: LEGACY_ID,
        legacyPlanId: 2,
        legacyLevelId: 4,
        isEnabled: false,
        phoneNumber: "",
        dateOfBirth: new Date("1990-05-01T00:00:00.000Z"),
      },
    });
  });

  it("writes a null credential for the ratified junk account", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow({ id: 17, username: "admin" })], emptySnapshot()));

    expect(argsAt(calls, "user.create")).toMatchObject({ data: { password: null } });
    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: { isEnabled: false, importedPasswordHash: null },
    });
  });
});

describe("applyImport — attach", () => {
  const matchedSnapshot = emptySnapshot({
    users: [
      {
        id: "user_platform",
        email: "athlete@tdp.local",
        matchEmail: "athlete@tdp.local",
        role: "ATHLETE",
        deletedAt: null,
        password: COST_12_HASH,
        identityLegacyUserId: null,
      },
    ],
  });

  it("writes only the identity and never touches the platform user", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], matchedSnapshot));

    expect(paths(calls)).toEqual(["identity.create"]);
  });

  it("hangs the identity on the matched user", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], matchedSnapshot));

    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: { userId: "user_platform", legacyUserId: LEGACY_ID },
    });
  });

  it("claims no credential provenance for a user whose password it never wrote", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], matchedSnapshot));

    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: { importedPasswordHash: null },
    });
  });
});

describe("applyImport — refresh", () => {
  const snapshotWith = (password: string | null, marker: string | null = null) =>
    emptySnapshot({
      identities: [storedIdentity({ importedPasswordHash: marker })],
      users: [
        {
          id: "user_platform",
          email: "athlete@tdp.local",
          matchEmail: "athlete@tdp.local",
          role: "ATHLETE",
          deletedAt: null,
          password,
          identityLegacyUserId: LEGACY_ID,
        },
      ],
    });

  it("updates the identity mirror in place", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor(
        [sourceRow({ training_level_id: 4 })],
        snapshotWith(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH),
      ),
    );

    expect(paths(calls)).toEqual(["identity.update"]);
    expect(argsAt(calls, "identity.update")).toMatchObject({
      where: { legacyUserId: LEGACY_ID },
      data: { legacyLevelId: 4 },
    });
  });

  it("leaves the marker alone on a mirror-only update", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor(
        [sourceRow({ training_level_id: 4 })],
        snapshotWith(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH),
      ),
    );

    expect(argsAt(calls, "identity.update").data).not.toHaveProperty("importedPasswordHash");
  });

  it("records the marker for a credential it can see is the one it wrote", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], snapshotWith(GOLDEN_BCRYPT_HASH)));

    expect(paths(calls)).toEqual(["identity.update"]);
    expect(argsAt(calls, "identity.update")).toMatchObject({
      where: { legacyUserId: LEGACY_ID },
      data: { importedPasswordHash: GOLDEN_BCRYPT_HASH },
    });
  });

  it("restores the export hash over a marked credential when asked to", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(OTHER_COST_10_HASH, OTHER_COST_10_HASH), true),
    );

    expect(paths(calls)).toEqual(["user.update", "identity.update"]);
    expect(argsAt(calls, "user.update")).toEqual({
      where: { id: "user_platform", password: OTHER_COST_10_HASH },
      data: { password: GOLDEN_BCRYPT_HASH },
    });
  });

  it("moves the marker onto the credential it just restored", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(OTHER_COST_10_HASH, OTHER_COST_10_HASH), true),
    );

    expect(argsAt(calls, "identity.update")).toMatchObject({
      data: { importedPasswordHash: GOLDEN_BCRYPT_HASH },
    });
  });

  it("leaves a credential no marker vouches for untouched, whatever its cost factor", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], snapshotWith(COST_12_HASH), true));

    expect(paths(calls)).toEqual([]);
  });

  it("never replaces a marked credential unless restore is explicitly enabled", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(OTHER_COST_10_HASH, OTHER_COST_10_HASH)),
    );

    expect(paths(calls)).not.toContain("user.update");
  });

  it("never hands a credential to a platform user that has none", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], snapshotWith(null), true));

    expect(paths(calls)).not.toContain("user.update");
  });

  it("is a no-op on a second run against state it already wrote", async () => {
    const { writer, calls } = fakeWriter();
    const plan = planFor([sourceRow()], snapshotWith(GOLDEN_BCRYPT_HASH, GOLDEN_BCRYPT_HASH));

    await applyImport(writer, plan);

    expect(calls).toEqual([]);
    expect(plan.actions.at(0)).toMatchObject({ identityChanges: [] });
  });
});

describe("applyImport — refusal", () => {
  it("throws and writes nothing while any conflict stands, even beside writable rows", async () => {
    const { writer, calls } = fakeWriter();
    const plan = planFor(
      [
        sourceRow({ id: 30, username: "good-a@tdp.local" }),
        sourceRow({ id: 31, username: "good-b@tdp.local" }),
        sourceRow({ id: 32, username: "bad@tdp.local", training_level_id: 9 }),
        sourceRow({ id: 33, username: "good-c@tdp.local" }),
      ],
      emptySnapshot(),
    );

    expect(plan.actions).toHaveLength(3);
    expect(plan.conflicts).toHaveLength(1);

    await expect(applyImport(writer, plan)).rejects.toBeInstanceOf(ImportConflictError);
    expect(calls).toEqual([]);
  });

  it("reports how many conflicts blocked it without naming any row detail", async () => {
    const { writer } = fakeWriter();
    const plan = planFor(
      [sourceRow({ id: 20, training_level_id: 9 }), sourceRow({ id: 21, user_plan_id: 9 })],
      emptySnapshot(),
    );

    await expect(applyImport(writer, plan)).rejects.toThrow(/2 conflict\(s\) stand/);
  });

  it("writes nothing at all when the plan is empty", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, {
      actions: [],
      conflicts: [],
      warnings: [],
      reconciliation: { linksChecked: 0, linksWithIdentity: 0, violations: 0 },
      appPasswordChanges: [],
    });

    expect(calls).toEqual([]);
  });
});
