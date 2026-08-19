import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import { applyImport, ImportConflictError, type ImportWriter } from "./legacy-users-import-apply";
import { classifyImport } from "./legacy-users-import-classify";
import type { ImportPlan, PlatformSnapshot } from "./legacy-users-import-plan";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";

const COST_12_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";
const OTHER_COST_10_HASH = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";
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
    const counts = await applyImport(
      writer,
      planFor([sourceRow({ first_name: "Test", last_name: "Athlete" })], emptySnapshot()),
    );

    expect(counts).toEqual({ created: 1, attached: 0, refreshed: 0, credentialsRestored: 0 });
    expect(paths(calls)).toEqual(["user.create", "identity.create"]);
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
            date_of_birth: "1988-11-18",
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
        dateOfBirth: new Date("1988-11-18T00:00:00.000Z"),
      },
    });
  });

  it("writes a null credential for the ratified junk account", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow({ id: 17, username: "admin" })], emptySnapshot()));

    expect(argsAt(calls, "user.create")).toMatchObject({ data: { password: null } });
    expect(argsAt(calls, "identity.create")).toMatchObject({ data: { isEnabled: false } });
  });
});

describe("applyImport — attach", () => {
  const matchedSnapshot = emptySnapshot({
    users: [
      {
        id: "user_platform",
        email: "athlete@tdp.local",
        role: "ATHLETE",
        deletedAt: null,
        password: COST_12_HASH,
        identityLegacyUserId: null,
      },
    ],
  });

  it("writes only the identity and never touches the platform user", async () => {
    const { writer, calls } = fakeWriter();
    const counts = await applyImport(writer, planFor([sourceRow()], matchedSnapshot));

    expect(counts).toEqual({ created: 0, attached: 1, refreshed: 0, credentialsRestored: 0 });
    expect(paths(calls)).toEqual(["identity.create"]);
  });

  it("hangs the identity on the matched user", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], matchedSnapshot));

    expect(argsAt(calls, "identity.create")).toMatchObject({
      data: { userId: "user_platform", legacyUserId: LEGACY_ID },
    });
  });
});

describe("applyImport — refresh", () => {
  const snapshotWith = (password: string | null) =>
    emptySnapshot({
      identities: [storedIdentity()],
      users: [
        {
          id: "user_platform",
          email: "athlete@tdp.local",
          role: "ATHLETE",
          deletedAt: null,
          password,
          identityLegacyUserId: LEGACY_ID,
        },
      ],
    });

  it("updates the identity mirror in place", async () => {
    const { writer, calls } = fakeWriter();
    const counts = await applyImport(
      writer,
      planFor([sourceRow({ training_level_id: 4 })], snapshotWith(GOLDEN_BCRYPT_HASH)),
    );

    expect(counts).toEqual({ created: 0, attached: 0, refreshed: 1, credentialsRestored: 0 });
    expect(paths(calls)).toEqual(["identity.update"]);
    expect(argsAt(calls, "identity.update")).toMatchObject({
      where: { legacyUserId: LEGACY_ID },
      data: { legacyLevelId: 4 },
    });
  });

  it("restores the export hash over a drifted cost-10 credential when asked to", async () => {
    const { writer, calls } = fakeWriter();
    const counts = await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(OTHER_COST_10_HASH), true),
    );

    expect(counts.credentialsRestored).toBe(1);
    expect(paths(calls)).toEqual(["user.update"]);
    expect(argsAt(calls, "user.update")).toEqual({
      where: { id: "user_platform" },
      data: { password: GOLDEN_BCRYPT_HASH },
    });
  });

  it("leaves a platform-managed cost-12 credential untouched", async () => {
    const { writer, calls } = fakeWriter();
    const counts = await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(COST_12_HASH), true),
    );

    expect(counts.credentialsRestored).toBe(0);
    expect(paths(calls)).toEqual([]);
  });

  it("never replaces a drifted credential unless restore is explicitly enabled", async () => {
    const { writer, calls } = fakeWriter();
    const counts = await applyImport(
      writer,
      planFor([sourceRow()], snapshotWith(OTHER_COST_10_HASH)),
    );

    expect(counts.credentialsRestored).toBe(0);
    expect(paths(calls)).not.toContain("user.update");
  });

  it("never hands a credential to a platform user that has none", async () => {
    const { writer, calls } = fakeWriter();

    await applyImport(writer, planFor([sourceRow()], snapshotWith(null), true));

    expect(paths(calls)).not.toContain("user.update");
  });

  it("is a no-op on a second run against state it already wrote", async () => {
    const { writer, calls } = fakeWriter();
    const plan = planFor([sourceRow()], snapshotWith(GOLDEN_BCRYPT_HASH));
    const counts = await applyImport(writer, plan);

    expect(counts).toEqual({ created: 0, attached: 0, refreshed: 1, credentialsRestored: 0 });
    expect(calls).toEqual([]);
    expect(plan.actions.at(0)).toMatchObject({ identityChanges: [] });
  });
});

describe("applyImport — refusal", () => {
  it("throws and writes nothing while any conflict stands", async () => {
    const { writer, calls } = fakeWriter();
    const plan = planFor([sourceRow({ training_level_id: 9 })], emptySnapshot());

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
    const counts = await applyImport(writer, { actions: [], conflicts: [], warnings: [] });

    expect(counts).toEqual({ created: 0, attached: 0, refreshed: 0, credentialsRestored: 0 });
    expect(calls).toEqual([]);
  });
});
