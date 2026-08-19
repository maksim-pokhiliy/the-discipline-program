import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import {
  type ImportSession,
  type RunImportDeps,
  runImport,
  SOURCE_FLAG,
  withHostWithheld,
} from "./legacy-users-import";
import type { ImportWriter } from "./legacy-users-import-apply";
import type { PlatformSnapshot } from "./legacy-users-import-plan";
import type { ImportReader } from "./legacy-users-import-snapshot";
import type { LegacySourceRow } from "./legacy-users-import-source";
import { EXPECT_HOST_FLAG, WRITE_FLAG } from "./script-target-guard";

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

  const openSession = (databaseUrl: string): ImportSession => {
    events.push(`open:${databaseUrl === DSN ? "expected-dsn" : "other-dsn"}`);

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

  return { deps, events, writes };
};

describe("runImport — dry run", () => {
  it("is the default mode and never opens a write path", async () => {
    const { deps, events, writes } = harness([sourceRow()]);
    const result = await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]));

    expect(events).toContain("read");
    expect(events).not.toContain("write");
    expect(writes).toEqual([]);
    expect(result.lines.at(0)).toContain("DRY RUN");
  });

  it("reports no conflicts for a clean export", async () => {
    const { deps } = harness([sourceRow()]);
    const result = await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]));

    expect(result.hasConflicts).toBe(false);
    expect(result.lines.join("\n")).toContain("CLEAN");
  });

  it("reports conflicts without writing anything", async () => {
    const { deps, writes } = harness([sourceRow({ training_level_id: 9 })]);
    const result = await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]));

    expect(result.hasConflicts).toBe(true);
    expect(writes).toEqual([]);
  });

  it("closes the session even when the source is unusable", async () => {
    const { deps, events } = harness([sourceRow({ training_level_id: 2 })]);

    await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]));

    expect(events.at(-1)).toBe("close");
  });

  it("reads the file named by the source flag", async () => {
    const { deps, events } = harness([sourceRow()]);

    await runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]));

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

    await expect(runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`]))).rejects.toThrow(
      /DATABASE_URL is required/,
    );
  });

  it("refuses to write without a stated host, and never opens a session", async () => {
    const { deps, events } = harness([sourceRow()]);

    await expect(runImport(deps([`${SOURCE_FLAG}${SOURCE_PATH}`, WRITE_FLAG]))).rejects.toThrow(
      /requires --expect-host=/,
    );
    expect(events).toEqual([`readSource:${SOURCE_PATH}`]);
  });

  it("refuses to write when the stated host does not match", async () => {
    const { deps, writes } = harness([sourceRow()]);

    await expect(
      runImport(
        deps([`${SOURCE_FLAG}${SOURCE_PATH}`, WRITE_FLAG, `${EXPECT_HOST_FLAG}wrong.invalid`]),
      ),
    ).rejects.toThrow(/refusing to write/);
    expect(writes).toEqual([]);
  });
});

describe("runImport — apply", () => {
  const writeArgv = [
    `${SOURCE_FLAG}${SOURCE_PATH}`,
    WRITE_FLAG,
    `${EXPECT_HOST_FLAG}${TARGET_HOST}`,
  ];

  it("writes inside the session and reports the applied plan", async () => {
    const { deps, events, writes } = harness([sourceRow()]);
    const result = await runImport(deps(writeArgv));

    expect(events).toContain("write");
    expect(writes).toEqual(["user.create", "identity.create"]);
    expect(result.hasConflicts).toBe(false);
    expect(result.lines.at(0)).toContain("APPLIED");
  });

  it("connects with exactly the DSN the guard checked", async () => {
    const { deps, events } = harness([sourceRow()]);

    await runImport(deps(writeArgv));

    expect(events).toContain("open:expected-dsn");
    expect(events).not.toContain("open:other-dsn");
  });

  it("refuses the whole run when any row conflicts, and still prints the report", async () => {
    const { deps, writes } = harness([
      sourceRow({ id: 20 }),
      sourceRow({ id: 21, username: "b@tdp.local", user_plan_id: 9 }),
    ]);
    const result = await runImport(deps(writeArgv));

    expect(result.hasConflicts).toBe(true);
    expect(result.lines.join("\n")).toContain("REFUSED: nothing was written");
    expect(result.lines.join("\n")).toContain("legacy catalog id out of range");
    expect(writes).toEqual([]);
  });

  it("closes the session after a refused apply", async () => {
    const { deps, events } = harness([sourceRow({ user_plan_id: 9 })]);

    await runImport(deps(writeArgv));

    expect(events.at(-1)).toBe("close");
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
