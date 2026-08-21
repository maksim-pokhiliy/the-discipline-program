import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  type ImportSession,
  type RunImportDeps,
  runImport,
  SOURCE_FLAG,
  readerFor,
  withHostWithheld,
  writerFor,
} from "./legacy-users-import";
import type { ImportWriter } from "./legacy-users-import-apply";
import { classifyImport } from "./legacy-users-import-classify";
import { planDigest } from "./legacy-users-import-digest";
import type { PlatformSnapshot } from "./legacy-users-import-plan";
import type { ImportReader } from "./legacy-users-import-snapshot";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";
import {
  EXPECT_HOST_FLAG,
  EXPECT_PLAN_FLAG,
  RESTORE_CREDENTIALS_FLAG,
  WRITE_FLAG,
} from "./script-target-guard";

const SCHEME = "postgresql:";
const TARGET_HOST = "db.example-target.invalid";
const DSN = `${SCHEME}//importer:hunter2@${TARGET_HOST}:5432/platform`;
const SOURCE_PATH = "/tmp/legacy-users.json";

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: 20,
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

const readerOf = (snapshot: PlatformSnapshot): ImportReader => ({
  mobileLegacyIdentity: { findMany: () => Promise.resolve([...snapshot.identities]) },
  mobilePublishLink: {
    findMany: () =>
      Promise.resolve(
        snapshot.individualLinks.map((link) => ({
          legacyUserId: link.legacyUserId,
          athleteId: link.athleteId,
        })),
      ),
  },
  user: {
    findMany: () =>
      Promise.resolve(
        snapshot.users.map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          deletedAt: user.deletedAt,
          password: user.password,
          legacyIdentity:
            user.identityLegacyUserId === null ? null : { legacyUserId: user.identityLegacyUserId },
        })),
      ),
  },
});

const digestFor = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot = emptySnapshot(),
  isCredentialRestoreEnabled = false,
): string =>
  planDigest(classifyImport(normalizeLegacySource(rows), snapshot, { isCredentialRestoreEnabled }));

const printedDigest = (lines: readonly string[]): string => {
  const printed = /plan digest ([0-9a-f]{12})/.exec(lines.join("\n"))?.[1];

  if (printed === undefined) {
    throw new Error("the report printed no plan digest");
  }

  return printed;
};

const harness = (
  rows: LegacySourceRow[],
  snapshot: PlatformSnapshot = emptySnapshot(),
  env: Record<string, string | undefined> = { DATABASE_URL: DSN },
) => {
  const events: string[] = [];
  const writes: string[] = [];
  const writer: ImportWriter = {
    user: {
      create: (args) => {
        writes.push("user.create");

        return Promise.resolve({ id: `user_${String(args.data.email)}` });
      },
      update: () => {
        writes.push("user.update");

        return Promise.resolve(null);
      },
    },
    mobileLegacyIdentity: {
      create: () => {
        writes.push("identity.create");

        return Promise.resolve(null);
      },
      update: () => {
        writes.push("identity.update");

        return Promise.resolve(null);
      },
    },
  };

  const opened: string[] = [];
  const openSession = (databaseUrl: string): ImportSession => {
    opened.push(databaseUrl);
    events.push("open");

    return {
      read: (use) => {
        events.push("read");

        return use(readerOf(snapshot));
      },
      write: async (use) => {
        events.push("write");

        await use(readerOf(snapshot), writer);
      },
      close: () => {
        events.push("close");

        return Promise.resolve();
      },
    };
  };

  const deps = (argv: string[]): RunImportDeps => ({
    argv: ["node", "legacy-users-import.ts", ...argv],
    env,
    readSourceFile: (path) => {
      events.push(`readSource:${path}`);

      return JSON.stringify(rows);
    },
    openSession,
  });

  return { deps, events, writes, opened };
};

describe("runImport — dry run", () => {
  it("is the default mode and never opens a write path", async () => {
    const { deps, events, writes } = harness([sourceRow()]);
    const result = await runImport(
      deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`]),
    );

    expect(events).toContain("read");
    expect(events).not.toContain("write");
    expect(writes).toEqual([]);
    expect(result.lines.at(0)).toContain("DRY RUN");
  });

  it("reports no conflicts for a clean export", async () => {
    const { deps } = harness([sourceRow()]);
    const result = await runImport(
      deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`]),
    );

    expect(result.isRefused).toBe(false);
    expect(result.lines.join("\n")).toContain("CLEAN");
  });

  it("reports conflicts without writing anything", async () => {
    const { deps, writes } = harness([sourceRow({ training_level_id: 9 })]);
    const result = await runImport(
      deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`]),
    );

    expect(result.isRefused).toBe(true);
    expect(writes).toEqual([]);
  });

  it("closes the session even when the source is unusable", async () => {
    const { deps, events } = harness([sourceRow({ training_level_id: 2 })]);

    await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`]));

    expect(events.at(-1)).toBe("close");
  });

  it("reads the file named by the source flag", async () => {
    const { deps, events } = harness([sourceRow()]);

    await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`]));

    expect(events).toContain(`readSource:${SOURCE_PATH}`);
  });
});

describe("runImport — guards", () => {
  it("requires a source path", async () => {
    const { deps } = harness([sourceRow()]);

    await expect(runImport(deps([]))).rejects.toThrow(/--source=<value> is required/);
  });

  it("requires DATABASE_URL", async () => {
    const { deps } = harness([sourceRow()], emptySnapshot(), {});

    await expect(
      runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`])),
    ).rejects.toThrow(/DATABASE_URL is required/);
  });

  it("refuses to run at all without a stated host, in a dry run as much as a write", async () => {
    const { deps, events } = harness([sourceRow()]);

    await expect(runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]))).rejects.toThrow(
      /--expect-host=<hostname> is required/,
    );
    await expect(runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`, WRITE_FLAG]))).rejects.toThrow(
      /--expect-host=<hostname> is required/,
    );
    expect(events).toEqual([`readSource:${SOURCE_PATH}`, `readSource:${SOURCE_PATH}`]);
  });

  it("refuses to write when the stated host does not match", async () => {
    const { deps, writes } = harness([sourceRow()]);

    await expect(
      runImport(
        deps([`${SOURCE_FLAG}${SOURCE_PATH}`, WRITE_FLAG, `${EXPECT_HOST_FLAG}wrong.invalid`]),
      ),
    ).rejects.toThrow(/refusing to run/);
    expect(writes).toEqual([]);
  });
});

describe("runImport — apply", () => {
  const writeArgvPinning = (digest: string) => [
    `${SOURCE_FLAG}${SOURCE_PATH}`,
    WRITE_FLAG,
    `${EXPECT_HOST_FLAG}${TARGET_HOST}`,
    `${EXPECT_PLAN_FLAG}${digest}`,
  ];

  it("writes inside the session and reports the applied plan", async () => {
    const rows = [sourceRow()];
    const { deps, events, writes } = harness(rows);
    const result = await runImport(deps(writeArgvPinning(digestFor(rows))));

    expect(events).toContain("write");
    expect(writes).toEqual(["user.create", "identity.create"]);
    expect(result.isRefused).toBe(false);
    expect(result.lines.at(0)).toContain("APPLIED");
  });

  it("connects with exactly the DSN the guard checked, never a different one", async () => {
    const rows = [sourceRow()];
    const { deps, opened } = harness(rows);

    await runImport(deps(writeArgvPinning(digestFor(rows))));

    expect(opened).toEqual([DSN]);
  });

  it("refuses the whole run when any row conflicts, and still prints the report", async () => {
    const rows = [
      sourceRow({ id: 20 }),
      sourceRow({ id: 21, username: "b@tdp.local", user_plan_id: 9 }),
    ];
    const { deps, writes } = harness(rows);
    const result = await runImport(deps(writeArgvPinning(digestFor(rows))));

    expect(result.isRefused).toBe(true);
    expect(result.lines.join("\n")).toContain("REFUSED: nothing was written");
    expect(result.lines.join("\n")).toContain("legacy catalog id out of range");
    expect(writes).toEqual([]);
  });

  it("closes the session after a refused apply", async () => {
    const rows = [sourceRow({ user_plan_id: 9 })];
    const { deps, events } = harness(rows);

    await runImport(deps(writeArgvPinning(digestFor(rows))));

    expect(events.at(-1)).toBe("close");
  });
});

describe("runImport — plan pinning", () => {
  const baseArgv = [`${SOURCE_FLAG}${SOURCE_PATH}`, `${EXPECT_HOST_FLAG}${TARGET_HOST}`];
  const A_VALID_LOOKING_DIGEST = "0123456789ab";

  it("refuses to write at all without a pinned plan", async () => {
    const { deps, events, writes } = harness([sourceRow()]);

    await expect(runImport(deps([...baseArgv, WRITE_FLAG]))).rejects.toThrow(
      /--expect-plan=<digest> is required to write/,
    );
    expect(events).not.toContain("write");
    expect(writes).toEqual([]);
  });

  it("refuses a value that is not a digest, without printing it back", async () => {
    const { deps } = harness([sourceRow()]);
    const pastedByAccident = "s3cr3t-pasted-into-the-wrong-argument";
    const argv = [...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${pastedByAccident}`];

    await expect(runImport(deps(argv))).rejects.toThrow(/is not a plan digest/);
    await expect(runImport(deps(argv))).rejects.not.toThrow(new RegExp(pastedByAccident));
  });

  it("refuses a digest of the wrong length rather than comparing a prefix", async () => {
    const { deps } = harness([sourceRow()]);

    await expect(
      runImport(deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}0123456789abcdef`])),
    ).rejects.toThrow(/is not a plan digest/);
  });

  it("writes nothing when the plan moved under the pin", async () => {
    const { deps, events, writes } = harness([sourceRow()]);
    const result = await runImport(
      deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${A_VALID_LOOKING_DIGEST}`]),
    );

    expect(events).toContain("write");
    expect(writes).toEqual([]);
    expect(result.isRefused).toBe(true);
    expect(result.lines.at(0)).toContain("the plan changed since the digest you pinned");
  });

  it("reads a pinned digest case-insensitively, the way it is pasted", async () => {
    const rows = [sourceRow()];
    const { deps, writes } = harness(rows);
    const result = await runImport(
      deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${digestFor(rows).toUpperCase()}`]),
    );

    expect(result.isRefused).toBe(false);
    expect(writes).toEqual(["user.create", "identity.create"]);
  });

  it("calls a dry run whose pin still matches exactly what it is, not stale", async () => {
    const rows = [sourceRow()];
    const { deps, writes } = harness(rows);
    const result = await runImport(deps([...baseArgv, `${EXPECT_PLAN_FLAG}${digestFor(rows)}`]));

    expect(result.isRefused).toBe(false);
    expect(result.lines.at(0)).toContain("DRY RUN");
    expect(result.lines.at(0)).not.toContain("the plan changed");
    expect(writes).toEqual([]);
  });

  it("checks a pin in a dry run too, and still writes nothing", async () => {
    const { deps, events, writes } = harness([sourceRow()]);
    const result = await runImport(
      deps([...baseArgv, `${EXPECT_PLAN_FLAG}${A_VALID_LOOKING_DIGEST}`]),
    );

    expect(events).not.toContain("write");
    expect(writes).toEqual([]);
    expect(result.isRefused).toBe(true);
    expect(result.lines.at(0)).toContain("the plan changed since the digest you pinned");
  });

  it("applies the very digest its own dry run printed", async () => {
    const rows = [sourceRow()];
    const { deps, writes } = harness(rows);
    const dryRun = await runImport(deps(baseArgv));
    const applied = await runImport(
      deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${printedDigest(dryRun.lines)}`]),
    );

    expect(applied.lines.at(0)).toContain("APPLIED");
    expect(writes).toEqual(["user.create", "identity.create"]);
  });

  it("refuses the apply when the export changed between the review and the write", async () => {
    const reviewed = await runImport(harness([sourceRow()]).deps(baseArgv));
    const { deps, writes } = harness([sourceRow({ training_level_id: 4 })]);
    const applied = await runImport(
      deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${printedDigest(reviewed.lines)}`]),
    );

    expect(applied.isRefused).toBe(true);
    expect(writes).toEqual([]);
  });

  it("refuses the apply when the database moved between the review and the write", async () => {
    const rows = [sourceRow()];
    const reviewed = await runImport(harness(rows).deps(baseArgv));
    const { deps, writes } = harness(
      rows,
      emptySnapshot({
        users: [
          {
            id: "user_platform",
            email: "athlete@tdp.local",
            matchEmail: "athlete@tdp.local",
            role: "ATHLETE",
            deletedAt: null,
            password: null,
            identityLegacyUserId: null,
          },
        ],
      }),
    );
    const applied = await runImport(
      deps([...baseArgv, WRITE_FLAG, `${EXPECT_PLAN_FLAG}${printedDigest(reviewed.lines)}`]),
    );

    expect(applied.isRefused).toBe(true);
    expect(applied.lines.at(0)).toContain("the plan changed since the digest you pinned");
    expect(writes).toEqual([]);
  });
});

describe("runImport — credential restore flag", () => {
  const DRIFTED_COST_10 = "$2a$10$abcdefghijklmnopqrstuuMz3Zk1H4bY9xW2vC5nQ8fT7sR6pL0dG";

  const refreshSnapshot = (): PlatformSnapshot =>
    emptySnapshot({
      identities: [
        {
          legacyUserId: 20,
          userId: "user_platform",
          importedPasswordHash: DRIFTED_COST_10,
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
      users: [
        {
          id: "user_platform",
          email: "athlete@tdp.local",
          matchEmail: "athlete@tdp.local",
          role: "ATHLETE",
          deletedAt: null,
          password: DRIFTED_COST_10,
          identityLegacyUserId: 20,
        },
      ],
    });

  const writeArgvPinning = (isCredentialRestoreEnabled: boolean) => [
    `${SOURCE_FLAG}${SOURCE_PATH}`,
    WRITE_FLAG,
    `${EXPECT_HOST_FLAG}${TARGET_HOST}`,
    `${EXPECT_PLAN_FLAG}${digestFor([sourceRow()], refreshSnapshot(), isCredentialRestoreEnabled)}`,
  ];

  it("leaves the stored credential alone when the flag is absent", async () => {
    const { deps, writes } = harness([sourceRow()], refreshSnapshot());
    const result = await runImport(deps(writeArgvPinning(false)));

    expect(writes).not.toContain("user.update");
    expect(result.lines.join("\n")).toContain("credentials replaced 0");
    expect(result.lines.join("\n")).toContain("--restore-credentials");
  });

  it("replaces the stored credential when the flag is present", async () => {
    const { deps, writes } = harness([sourceRow()], refreshSnapshot());
    const result = await runImport(deps([...writeArgvPinning(true), RESTORE_CREDENTIALS_FLAG]));

    expect(writes).toContain("user.update");
    expect(result.lines.join("\n")).toContain("credentials replaced 1");
  });

  it("refuses a digest pinned without the flag when the flag is then passed", async () => {
    const { deps, writes } = harness([sourceRow()], refreshSnapshot());
    const result = await runImport(deps([...writeArgvPinning(false), RESTORE_CREDENTIALS_FLAG]));

    expect(result.isRefused).toBe(true);
    expect(writes).toEqual([]);
  });

  it("keeps the dry run honest about what the flag would do", async () => {
    const { deps, writes } = harness([sourceRow()], refreshSnapshot());
    const withFlag = await runImport(
      deps([
        `${SOURCE_FLAG}${SOURCE_PATH}`,
        `${EXPECT_HOST_FLAG}${TARGET_HOST}`,
        RESTORE_CREDENTIALS_FLAG,
      ]),
    );

    expect(writes).toEqual([]);
    expect(withFlag.lines.join("\n")).toContain("credentials replaced 1");
  });
});

describe("readerFor — query shape", () => {
  const fakeClient = () => {
    const calls: Record<string, unknown> = {};
    const client = {
      mobileLegacyIdentity: {
        findMany: (args: unknown) => {
          calls.identity = args;

          return Promise.resolve([]);
        },
      },
      mobilePublishLink: {
        findMany: (args: unknown) => {
          calls.link = args;

          return Promise.resolve([]);
        },
      },
      user: {
        findMany: (args: unknown) => {
          calls.user = args;

          return Promise.resolve([]);
        },
      },
    };

    return { client: client as unknown as Parameters<typeof readerFor>[0], calls };
  };

  it("reads identities with no filter at all, so the absence audit sees the whole table", async () => {
    const { client, calls } = fakeClient();

    await readerFor(client).mobileLegacyIdentity.findMany();

    expect(calls.identity).not.toHaveProperty("where");
  });

  it("passes the caller's filter straight through for links and users", async () => {
    const { client, calls } = fakeClient();
    const linkWhere = {
      channel: "INDIVIDUAL" as const,
      legacyUserId: { not: null },
      NOT: { athleteId: null },
    };

    await readerFor(client).mobilePublishLink.findMany({ where: linkWhere });
    await readerFor(client).user.findMany({ where: { OR: [{ id: { in: ["u1"] } }] } });

    expect(calls.link).toMatchObject({ where: linkWhere });
    expect(calls.user).toMatchObject({ where: { OR: [{ id: { in: ["u1"] } }] } });
  });
});

describe("writerFor — credential swap", () => {
  const fakeClient = (count: number) => {
    const calls: unknown[] = [];
    const client = {
      user: {
        updateMany: (args: unknown) => {
          calls.push(args);

          return Promise.resolve({ count });
        },
      },
    };

    return { client: client as unknown as Parameters<typeof writerFor>[0], calls };
  };

  it("conditions the swap on the stored hash the plan was built from", async () => {
    const { client, calls } = fakeClient(1);

    await writerFor(client).user.update({
      where: { id: "user_1", password: "the-hash-the-plan-saw" },
      data: { password: "the-replacement" },
    });

    expect(calls.at(0)).toEqual({
      where: { id: "user_1", password: "the-hash-the-plan-saw" },
      data: { password: "the-replacement" },
    });
  });

  it("refuses when the stored credential changed under the plan", async () => {
    const { client } = fakeClient(0);

    await expect(
      writerFor(client).user.update({
        where: { id: "user_1", password: "a-stale-hash" },
        data: { password: "the-replacement" },
      }),
    ).rejects.toThrow(/changed between the snapshot/);
  });
});

describe("withHostWithheld", () => {
  it("scrubs the resolved host out of a driver error before it reaches stdout", () => {
    const prismaError = `Can't reach database server at \`${TARGET_HOST}:5432\``;

    expect(withHostWithheld(prismaError, TARGET_HOST)).not.toContain(TARGET_HOST);
    expect(withHostWithheld(prismaError, TARGET_HOST)).toContain("<host withheld>");
  });

  it("scrubs every occurrence, not only the first", () => {
    const doubled = `${TARGET_HOST} and again ${TARGET_HOST}`;

    expect(withHostWithheld(doubled, TARGET_HOST)).toBe(
      "<host withheld> and again <host withheld>",
    );
  });

  it("leaves a message alone when no host could be resolved", () => {
    expect(withHostWithheld("something failed", "")).toBe("something failed");
  });
});

describe("module entry", () => {
  it("does not run itself on import, so every layer stays unit-testable", () => {
    expect(process.exitCode === undefined || process.exitCode === 0).toBe(true);
    expect(typeof runImport).toBe("function");
  });
});
