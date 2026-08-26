import { readFileSync } from "node:fs";

import { type Prisma, PrismaClient } from "@prisma/client";

import { applyImport, ImportConflictError, type ImportWriter } from "./legacy-users-import-apply";
import { classifyImport } from "./legacy-users-import-classify";
import { planDigest, PlanDigestMismatchError } from "./legacy-users-import-digest";
import type { ClassifyOptions, ImportPlan, PlatformIdentity } from "./legacy-users-import-plan";
import { renderImportReport } from "./legacy-users-import-report";
import { type ImportReader, loadPlatformSnapshot } from "./legacy-users-import-snapshot";
import { type ParsedLegacySource, parseLegacySource } from "./legacy-users-import-source";
import { closeQuietly, isEntryPoint, runScriptCli } from "./script-cli";
import {
  EXPECT_DATABASE_FLAG,
  EXPECT_HOST_FLAG,
  EXPECT_PLAN_FLAG,
  hasFlag,
  readExpectedPlan,
  rejectUnknownFlags,
  requireAttestedTarget,
  requireEnv,
  requireExpectedPlan,
  requireFlag,
  RESTORE_CREDENTIALS_FLAG,
  WRITE_FLAG,
} from "./script-target-guard";

export const SOURCE_FLAG = "--source=";
export const TRANSACTION_TIMEOUT_MS = 30_000;
export const TRANSACTION_MAX_WAIT_MS = 15_000;

const IDENTITY_SELECT = {
  legacyUserId: true,
  userId: true,
  importedPasswordHash: true,
  legacyRoleId: true,
  legacyPlanId: true,
  legacyLevelId: true,
  isEnabled: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  dateOfBirth: true,
} as const satisfies Record<keyof PlatformIdentity, true>;

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  deletedAt: true,
  password: true,
  legacyIdentity: { select: { legacyUserId: true } },
} as const;

export type ImportSession = {
  read: (use: (reader: ImportReader) => Promise<ImportPlan>) => Promise<ImportPlan>;
  write: (use: (reader: ImportReader, writer: ImportWriter) => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
};

export type RunImportDeps = {
  argv: readonly string[];
  env: Record<string, string | undefined>;
  readSourceFile: (path: string) => string;
  openSession: (databaseUrl: string) => ImportSession;
};

export type RunImportResult = { lines: readonly string[]; isRefused: boolean };

type PlanInputs = { source: ParsedLegacySource; options: ClassifyOptions };

type RunMode =
  | { kind: "dry-run"; pinnedDigest: string | null }
  | { kind: "apply"; pinnedDigest: string };

export const readerFor = (client: Prisma.TransactionClient): ImportReader => ({
  mobileLegacyIdentity: {
    findMany: () => client.mobileLegacyIdentity.findMany({ select: IDENTITY_SELECT }),
  },
  mobilePublishLink: {
    findMany: ({ where }) =>
      client.mobilePublishLink.findMany({
        where,
        select: { legacyUserId: true, athleteId: true },
      }),
  },
  user: {
    findMany: ({ where }) => client.user.findMany({ where, select: USER_SELECT }),
  },
});

export const writerFor = (client: Prisma.TransactionClient): ImportWriter => ({
  user: {
    create: ({ data, select }) => client.user.create({ data, select }),
    update: async ({ where, data: { password } }) => {
      const swapped = await client.user.updateMany({
        where: { id: where.id, password: where.password },
        data: { password },
      });

      if (swapped.count === 0) {
        throw new Error(
          "refusing to write: the stored credential changed between the snapshot this plan was " +
            "built from and the write. Nothing was written; re-run so the report reflects the " +
            "current state.",
        );
      }
    },
  },
  mobileLegacyIdentity: {
    create: ({ data }) => client.mobileLegacyIdentity.create({ data }),
    update: ({ where, data }) => client.mobileLegacyIdentity.update({ where, data }),
  },
});

export const openPrismaSession = (databaseUrl: string): ImportSession => {
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

const buildPlan = async (reader: ImportReader, inputs: PlanInputs): Promise<ImportPlan> =>
  classifyImport(
    inputs.source,
    await loadPlatformSnapshot(reader, inputs.source.rows),
    inputs.options,
  );

const resolveMode = (argv: readonly string[]): RunMode =>
  hasFlag(argv, WRITE_FLAG)
    ? { kind: "apply", pinnedDigest: requireExpectedPlan(argv) }
    : { kind: "dry-run", pinnedDigest: readExpectedPlan(argv) };

const runDryRun = async (
  session: ImportSession,
  inputs: PlanInputs,
  pinnedDigest: string | null,
): Promise<RunImportResult> => {
  const plan = await session.read((reader) => buildPlan(reader, inputs));
  const isStale = pinnedDigest !== null && planDigest(plan) !== pinnedDigest;

  return {
    lines: renderImportReport(plan, isStale ? "stale-plan" : "dry-run"),
    isRefused: isStale || plan.conflicts.length > 0,
  };
};

const runApply = async (
  session: ImportSession,
  inputs: PlanInputs,
  pinnedDigest: string,
): Promise<RunImportResult> => {
  const attempted: { plan: ImportPlan | null } = { plan: null };

  try {
    await session.write(async (reader, writer) => {
      const planned = await buildPlan(reader, inputs);

      attempted.plan = planned;

      const recomputed = planDigest(planned);

      if (recomputed !== pinnedDigest) {
        throw new PlanDigestMismatchError(pinnedDigest, recomputed);
      }

      await applyImport(writer, planned);
    });
  } catch (error: unknown) {
    const refused = attempted.plan;

    if (refused === null) {
      throw error;
    }

    if (error instanceof PlanDigestMismatchError) {
      return { lines: renderImportReport(refused, "stale-plan"), isRefused: true };
    }

    if (error instanceof ImportConflictError) {
      return { lines: renderImportReport(refused, "refused"), isRefused: true };
    }

    throw error;
  }

  const applied = attempted.plan;

  if (applied === null) {
    throw new Error("the transaction returned without producing a plan");
  }

  return { lines: renderImportReport(applied, "applied"), isRefused: false };
};

export const runImport = async (deps: RunImportDeps): Promise<RunImportResult> => {
  rejectUnknownFlags(deps.argv, [
    SOURCE_FLAG,
    WRITE_FLAG,
    EXPECT_HOST_FLAG,
    EXPECT_DATABASE_FLAG,
    EXPECT_PLAN_FLAG,
    RESTORE_CREDENTIALS_FLAG,
  ]);

  const sourcePath = requireFlag(deps.argv, SOURCE_FLAG);
  const databaseUrl = requireEnv(deps.env, "DATABASE_URL");
  const isCredentialRestoreEnabled = hasFlag(deps.argv, RESTORE_CREDENTIALS_FLAG);
  const source = parseLegacySource(JSON.parse(deps.readSourceFile(sourcePath)));

  requireAttestedTarget(deps.argv, databaseUrl);

  const mode = resolveMode(deps.argv);
  const inputs: PlanInputs = { source, options: { isCredentialRestoreEnabled } };
  const session = deps.openSession(databaseUrl);

  try {
    return mode.kind === "apply"
      ? await runApply(session, inputs, mode.pinnedDigest)
      : await runDryRun(session, inputs, mode.pinnedDigest);
  } finally {
    await closeQuietly(() => session.close());
  }
};

if (isEntryPoint(process.argv[1], import.meta.url)) {
  void runScriptCli({
    run: () =>
      runImport({
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
