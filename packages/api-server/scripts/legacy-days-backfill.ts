import { readFileSync } from "node:fs";

import { type Prisma, PrismaClient } from "@prisma/client";

import {
  applyBackfill,
  BackfillConflictError,
  type BackfillWriter,
  DayNoLongerEmptyError,
} from "./legacy-days-backfill-apply";
import { classifyBackfill } from "./legacy-days-backfill-classify";
import { backfillDigest } from "./legacy-days-backfill-digest";
import type { BackfillPlan } from "./legacy-days-backfill-plan";
import { renderBackfillReport } from "./legacy-days-backfill-report";
import { type BackfillReader, loadBackfillSnapshot } from "./legacy-days-backfill-snapshot";
import { type ParsedLegacyDays, parseLegacyDays } from "./legacy-days-backfill-source";
import { closeQuietly, isEntryPoint, runScriptCli } from "./script-cli";
import {
  EXPECT_DATABASE_FLAG,
  EXPECT_HOST_FLAG,
  EXPECT_PLAN_FLAG,
  hasFlag,
  PlanDigestMismatchError,
  readExpectedPlan,
  rejectUnknownFlags,
  requireAttestedTarget,
  requireEnv,
  requireExpectedPlan,
  requireFlag,
  WRITE_FLAG,
} from "./script-target-guard";

export const SOURCE_FLAG = "--source=";
export const TRANSACTION_TIMEOUT_MS = 120_000;
export const TRANSACTION_MAX_WAIT_MS = 15_000;

const DAY_SELECT = {
  id: true,
  scheduledDate: true,
  legacyRowId: true,
  link: {
    select: {
      channel: true,
      legacyLevelId: true,
      legacyUserId: true,
      plan: { select: { name: true } },
    },
  },
} as const;

export type BackfillSession = {
  read: (use: (reader: BackfillReader) => Promise<BackfillPlan>) => Promise<BackfillPlan>;
  write: (use: (reader: BackfillReader, writer: BackfillWriter) => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
};

export type RunBackfillDeps = {
  argv: readonly string[];
  env: Record<string, string | undefined>;
  readSourceFile: (path: string) => string;
  openSession: (databaseUrl: string) => BackfillSession;
};

export type RunBackfillResult = { lines: readonly string[]; isRefused: boolean };

type RunMode =
  | { kind: "dry-run"; pinnedDigest: string | null }
  | { kind: "apply"; pinnedDigest: string };

export const readerFor = (client: Prisma.TransactionClient): BackfillReader => ({
  mobilePublishedDay: {
    findMany: ({ where }) => client.mobilePublishedDay.findMany({ where, select: DAY_SELECT }),
    count: ({ where }) => client.mobilePublishedDay.count({ where }),
  },
});

export const writerFor = (client: Prisma.TransactionClient): BackfillWriter => ({
  mobilePublishedDay: {
    updateMany: ({ where, data }) => client.mobilePublishedDay.updateMany({ where, data }),
  },
});

export const openPrismaSession = (databaseUrl: string): BackfillSession => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

  return {
    read: (use) => use(readerFor(prisma)),
    write: (use) =>
      prisma.$transaction((tx) => use(readerFor(tx), writerFor(tx)), {
        timeout: TRANSACTION_TIMEOUT_MS,
        maxWait: TRANSACTION_MAX_WAIT_MS,
      }),
    close: () => prisma.$disconnect(),
  };
};

const buildPlan = async (reader: BackfillReader, source: ParsedLegacyDays): Promise<BackfillPlan> =>
  classifyBackfill(source, await loadBackfillSnapshot(reader));

const resolveMode = (argv: readonly string[]): RunMode =>
  hasFlag(argv, WRITE_FLAG)
    ? { kind: "apply", pinnedDigest: requireExpectedPlan(argv) }
    : { kind: "dry-run", pinnedDigest: readExpectedPlan(argv) };

const runDryRun = async (
  session: BackfillSession,
  source: ParsedLegacyDays,
  pinnedDigest: string | null,
): Promise<RunBackfillResult> => {
  const plan = await session.read((reader) => buildPlan(reader, source));
  const isStale = pinnedDigest !== null && backfillDigest(plan) !== pinnedDigest;

  return {
    lines: renderBackfillReport(plan, isStale ? "stale-plan" : "dry-run"),
    isRefused: isStale || plan.conflicts.length > 0,
  };
};

const runApply = async (
  session: BackfillSession,
  source: ParsedLegacyDays,
  pinnedDigest: string,
): Promise<RunBackfillResult> => {
  const attempted: { plan: BackfillPlan | null } = { plan: null };

  try {
    await session.write(async (reader, writer) => {
      const planned = await buildPlan(reader, source);

      attempted.plan = planned;

      const recomputed = backfillDigest(planned);

      if (recomputed !== pinnedDigest) {
        throw new PlanDigestMismatchError(pinnedDigest, recomputed);
      }

      await applyBackfill(writer, planned);
    });
  } catch (error: unknown) {
    const refused = attempted.plan;

    if (refused === null) {
      throw error;
    }

    if (error instanceof PlanDigestMismatchError) {
      return { lines: renderBackfillReport(refused, "stale-plan"), isRefused: true };
    }

    if (error instanceof BackfillConflictError || error instanceof DayNoLongerEmptyError) {
      return {
        lines: [...renderBackfillReport(refused, "refused"), "", error.message],
        isRefused: true,
      };
    }

    throw error;
  }

  const applied = attempted.plan;

  if (applied === null) {
    throw new Error("the transaction returned without producing a plan");
  }

  return { lines: renderBackfillReport(applied, "applied"), isRefused: false };
};

export const runBackfill = async (deps: RunBackfillDeps): Promise<RunBackfillResult> => {
  rejectUnknownFlags(deps.argv, [
    SOURCE_FLAG,
    WRITE_FLAG,
    EXPECT_HOST_FLAG,
    EXPECT_DATABASE_FLAG,
    EXPECT_PLAN_FLAG,
  ]);

  const sourcePath = requireFlag(deps.argv, SOURCE_FLAG);
  const databaseUrl = requireEnv(deps.env, "DATABASE_URL");
  const source = parseLegacyDays(JSON.parse(deps.readSourceFile(sourcePath)));

  requireAttestedTarget(deps.argv, databaseUrl);

  const mode = resolveMode(deps.argv);
  const session = deps.openSession(databaseUrl);

  try {
    return mode.kind === "apply"
      ? await runApply(session, source, mode.pinnedDigest)
      : await runDryRun(session, source, mode.pinnedDigest);
  } finally {
    await closeQuietly(() => session.close());
  }
};

if (isEntryPoint(process.argv[1], import.meta.url)) {
  void runScriptCli({
    run: () =>
      runBackfill({
        argv: process.argv,
        env: process.env,
        readSourceFile: (path) => readFileSync(path, "utf8"),
        openSession: openPrismaSession,
      }),
    env: process.env,
    writeLine: (line) => {
      console.log(line);
    },
    writeError: (line) => {
      console.error(line);
    },
    fail: () => {
      process.exitCode = 1;
    },
  });
}
