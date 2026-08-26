import { describe, expect, it, vi } from "vitest";

import { type BackfillSession, runBackfill, type RunBackfillDeps } from "./legacy-days-backfill";
import type { BackfillWriter } from "./legacy-days-backfill-apply";
import type { BackfillReader, LedgerRow } from "./legacy-days-backfill-snapshot";
import { withHostWithheld } from "./script-cli";

const HOSTNAME = "db.example-target.invalid";
const AUTHORITY = `${HOSTNAME}:5432`;
const DATABASE = "platform";
const ATTEST = [`--expect-host=${AUTHORITY}`, `--expect-database=${DATABASE}`];
const DSN = `${"postgresql:"}//filler:hunter2@${HOSTNAME}:5432/platform`;
const DATE = "2026-07-01";
const PROGRAM = {
  dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "WARM-UP", exercises: ["200 m row"] }] }],
};

const SOURCE = JSON.stringify({
  general: [
    {
      id: 11,
      scheduled_date: DATE,
      training_level_id: 2,
      is_rest_day: false,
      daily_program: PROGRAM,
    },
  ],
  individual: [],
});

const CONFLICTING_SOURCE = JSON.stringify({
  general: [
    {
      id: 11,
      scheduled_date: DATE,
      training_level_id: 2,
      is_rest_day: false,
      daily_program: PROGRAM,
    },
    {
      id: 12,
      scheduled_date: DATE,
      training_level_id: 2,
      is_rest_day: false,
      daily_program: PROGRAM,
    },
  ],
  individual: [],
});

const digestIn = (result: { lines: readonly string[] }): string => {
  const line = result.lines.find((candidate) => candidate.startsWith("plan digest "));

  if (line === undefined) {
    throw new Error(`no digest line in:\n${result.lines.join("\n")}`);
  }

  return line.slice("plan digest ".length, "plan digest ".length + 12);
};

const ledgerRow = (overrides: Partial<LedgerRow> = {}): LedgerRow => ({
  id: "day_1",
  scheduledDate: new Date(`${DATE}T00:00:00.000Z`),
  legacyRowId: 11,
  link: {
    channel: "GENERAL",
    legacyLevelId: 2,
    legacyUserId: null,
    plan: { name: "Winter Cycle" },
  },
  ...overrides,
});

type Recorded = { updates: unknown[] };

const sessionFor = (
  rows: LedgerRow[],
  recorded: Recorded,
  filled = 0,
  updatedCount = 1,
): BackfillSession => {
  const reader: BackfillReader = {
    mobilePublishedDay: {
      findMany: () => Promise.resolve(rows),
      count: () => Promise.resolve(filled),
    },
  };
  const writer: BackfillWriter = {
    mobilePublishedDay: {
      updateMany: (args) => {
        recorded.updates.push(args);

        return Promise.resolve({ count: updatedCount });
      },
    },
  };

  return {
    read: (use) => use(reader),
    write: (use) => use(reader, writer),
    close: () => Promise.resolve(),
  };
};

const depsFor = (
  argv: string[],
  rows: LedgerRow[] = [ledgerRow()],
  recorded: Recorded = { updates: [] },
): RunBackfillDeps => ({
  argv: ["node", "legacy-days-backfill.ts", ...argv],
  env: { DATABASE_URL: DSN },
  readSourceFile: () => SOURCE,
  openSession: () => sessionFor(rows, recorded),
});

const run = (argv: string[], rows?: LedgerRow[], recorded?: Recorded) =>
  runBackfill(depsFor(argv, rows, recorded));

const digestOf = async (argv: string[], rows?: LedgerRow[]): Promise<string> =>
  digestIn(await run(argv, rows));

describe("runBackfill — the target guard", () => {
  it("refuses a dry run that does not state the host it expects", async () => {
    await expect(run([`--source=/tmp/days.json`])).rejects.toThrow("--expect-host=");
  });

  it("refuses a host that is not the one the DSN resolved to", async () => {
    await expect(
      run([`--source=/tmp/days.json`, "--expect-host=db.somewhere-else.invalid"]),
    ).rejects.toThrow("refusing to run");
  });

  it("refuses a flag it does not recognise, naming only the flag", async () => {
    await expect(run([`--source=/tmp/days.json`, ...ATTEST, "--force"])).rejects.toThrow("--force");
  });

  it("refuses a write that does not pin the plan that was reviewed", async () => {
    await expect(run([`--source=/tmp/days.json`, ...ATTEST, "--write"])).rejects.toThrow(
      "--expect-plan=",
    );
  });

  it("refuses a DSN carrying a host query parameter", async () => {
    await expect(
      runBackfill({
        ...depsFor([`--source=/tmp/days.json`, ...ATTEST]),
        env: { DATABASE_URL: `${DSN}?host=/var/run/postgresql` },
      }),
    ).rejects.toThrow("host query parameter");
  });
});

describe("runBackfill — dry run", () => {
  it("writes nothing and reports what it would fill", async () => {
    const recorded: Recorded = { updates: [] };
    const result = await run([`--source=/tmp/days.json`, ...ATTEST], [ledgerRow()], recorded);

    expect(recorded.updates).toEqual([]);
    expect(result.isRefused).toBe(false);
    expect(result.lines.join("\n")).toContain("DRY RUN, nothing was written");
    expect(result.lines.join("\n")).toContain("fill 1 ·");
  });

  it("refuses when the export contradicts itself, and says nothing was written", async () => {
    const result = await runBackfill({
      ...depsFor([`--source=/tmp/days.json`, ...ATTEST]),
      readSourceFile: () =>
        JSON.stringify({
          general: [
            {
              id: 11,
              scheduled_date: DATE,
              training_level_id: 2,
              is_rest_day: true,
              daily_program: PROGRAM,
            },
          ],
          individual: [],
        }),
    });

    expect(result.isRefused).toBe(true);
    expect(result.lines.join("\n")).toContain("rest day carrying a program");
  });

  it("refuses a dry run pinned to a digest this database no longer produces", async () => {
    const result = await run([`--source=/tmp/days.json`, ...ATTEST, "--expect-plan=0123456789ab"]);

    expect(result.isRefused).toBe(true);
    expect(result.lines.join("\n")).toContain("the plan changed since the digest you pinned");
  });
});

describe("runBackfill — apply", () => {
  it("fills the day when the pinned digest still describes this plan", async () => {
    const digest = await digestOf([`--source=/tmp/days.json`, ...ATTEST]);
    const recorded: Recorded = { updates: [] };
    const result = await run(
      [`--source=/tmp/days.json`, ...ATTEST, "--write", `--expect-plan=${digest}`],
      [ledgerRow()],
      recorded,
    );

    expect(result.isRefused).toBe(false);
    expect(result.lines.join("\n")).toContain("APPLIED");
    expect(recorded.updates).toHaveLength(1);
  });

  it("refuses a stale pin with zero writes", async () => {
    const recorded: Recorded = { updates: [] };
    const result = await run(
      [`--source=/tmp/days.json`, ...ATTEST, "--write", "--expect-plan=0123456789ab"],
      [ledgerRow()],
      recorded,
    );

    expect(result.isRefused).toBe(true);
    expect(recorded.updates).toEqual([]);
    expect(result.lines.join("\n")).toContain("the plan changed since the digest you pinned");
  });

  it("refuses to apply while a conflict stands, with zero writes", async () => {
    const recorded: Recorded = { updates: [] };
    const rows = [ledgerRow()];
    const argv = [`--source=/tmp/days.json`, ...ATTEST];
    const digest = await runBackfill({
      ...depsFor(argv, rows),
      readSourceFile: () => CONFLICTING_SOURCE,
    }).then(digestIn);

    const result = await runBackfill({
      ...depsFor([...argv, "--write", `--expect-plan=${digest}`], rows, recorded),
      readSourceFile: () => CONFLICTING_SOURCE,
    });

    expect(recorded.updates).toEqual([]);
    expect(result.isRefused).toBe(true);
    expect(result.lines.join("\n")).toContain("several legacy rows sit on one day");
    expect(result.lines.join("\n")).toContain("Every conflict above has to be resolved first");
  });

  it("stops and says so when a day stopped being empty before the write reached it", async () => {
    const recorded: Recorded = { updates: [] };
    const rows = [ledgerRow()];
    const digest = await digestOf([`--source=/tmp/days.json`, ...ATTEST], rows);
    const result = await runBackfill({
      ...depsFor(
        [`--source=/tmp/days.json`, ...ATTEST, "--write", `--expect-plan=${digest}`],
        rows,
        recorded,
      ),
      openSession: () => sessionFor(rows, recorded, 0, 0),
    });
    const report = result.lines.join("\n");

    expect(result.isRefused).toBe(true);
    expect(report).toContain("REFUSED, nothing was written");
    expect(report).toContain("no longer empty by the time the write reached it");
    expect(report).toContain("do not pin this one");
    expect(report).not.toContain("CLEAN:");
    expect(report).not.toContain("pin it on the apply");
  });
});

describe("withHostWithheld", () => {
  it("takes the resolved host out of anything the run prints", () => {
    expect(withHostWithheld(`connect ECONNREFUSED ${HOSTNAME}:5432`, HOSTNAME)).toBe(
      "connect ECONNREFUSED <host withheld>:5432",
    );
  });

  it("leaves a message alone when no host could be resolved", () => {
    expect(withHostWithheld("something broke", "")).toBe("something broke");
  });
});

describe("runBackfill — the source file", () => {
  it("reads the export before it opens any session at all", async () => {
    const openSession = vi.fn(() => {
      throw new Error("the session must not be opened for an unreadable export");
    });

    await expect(
      runBackfill({
        ...depsFor([`--source=/tmp/days.json`, ...ATTEST]),
        readSourceFile: () => "{ not json",
        openSession,
      }),
    ).rejects.toThrow();
    expect(openSession).not.toHaveBeenCalled();
  });
});
