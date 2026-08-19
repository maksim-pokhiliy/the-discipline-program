import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type Prisma, PrismaClient } from "@prisma/client";

import { applyImport, ImportConflictError, type ImportWriter } from "./legacy-users-import-apply";
import { classifyImport } from "./legacy-users-import-classify";
import type { ImportPlan } from "./legacy-users-import-plan";
import { renderImportReport } from "./legacy-users-import-report";
import { type ImportReader, loadPlatformSnapshot } from "./legacy-users-import-snapshot";
import { parseLegacySource } from "./legacy-users-import-source";
import {
  hasFlag,
  parseTarget,
  requireEnv,
  requireFlag,
  requireWriteTarget,
  RESTORE_CREDENTIALS_FLAG,
  WRITE_FLAG,
} from "./script-target-guard";

export const SOURCE_FLAG = "--source=";
export const TRANSACTION_TIMEOUT_MS = 30_000;
export const TRANSACTION_MAX_WAIT_MS = 15_000;

const IDENTITY_SELECT = {
  legacyUserId: true,
  userId: true,
  legacyRoleId: true,
  legacyPlanId: true,
  legacyLevelId: true,
  isEnabled: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  dateOfBirth: true,
} as const;

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

export type RunImportResult = { lines: readonly string[]; hasConflicts: boolean };

export const withHostWithheld = (message: string, hostname: string): string =>
  hostname === "" ? message : message.replaceAll(hostname, "<host withheld>");

export const readerFor = (client: Prisma.TransactionClient): ImportReader => ({
  mobileLegacyIdentity: {
    findMany: ({ where }) =>
      client.mobileLegacyIdentity.findMany({ where, select: IDENTITY_SELECT }),
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
    update: ({ where, data: { password } }) => client.user.update({ where, data: { password } }),
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

export const runImport = async (deps: RunImportDeps): Promise<RunImportResult> => {
  const sourcePath = requireFlag(deps.argv, SOURCE_FLAG);
  const isWriting = hasFlag(deps.argv, WRITE_FLAG);
  const databaseUrl = requireEnv(deps.env, "DATABASE_URL");
  const isCredentialRestoreEnabled = hasFlag(deps.argv, RESTORE_CREDENTIALS_FLAG);
  const source = parseLegacySource(JSON.parse(deps.readSourceFile(sourcePath)));

  if (isWriting) {
    requireWriteTarget(deps.argv, databaseUrl);
  }

  const session = deps.openSession(databaseUrl);

  try {
    if (!isWriting) {
      const plan = await session.read(async (reader) =>
        classifyImport(source, await loadPlatformSnapshot(reader, source.rows), {
          isCredentialRestoreEnabled,
        }),
      );

      return {
        lines: renderImportReport(plan, "dry-run"),
        hasConflicts: plan.conflicts.length > 0,
      };
    }

    const attempted: { plan: ImportPlan | null } = { plan: null };

    try {
      await session.write(async (reader, writer) => {
        const planned = classifyImport(source, await loadPlatformSnapshot(reader, source.rows), {
          isCredentialRestoreEnabled,
        });

        attempted.plan = planned;

        await applyImport(writer, planned);
      });
    } catch (error: unknown) {
      const refused = attempted.plan;

      if (!(error instanceof ImportConflictError) || refused === null) {
        throw error;
      }

      return { lines: renderImportReport(refused, "refused"), hasConflicts: true };
    }

    const applied = attempted.plan;

    if (applied === null) {
      throw new Error("the transaction returned without producing a plan");
    }

    return { lines: renderImportReport(applied, "applied"), hasConflicts: false };
  } finally {
    await session.close();
  }
};

const main = async (): Promise<void> => {
  const result = await runImport({
    argv: process.argv,
    env: process.env,
    readSourceFile: (path) => readFileSync(path, "utf8"),
    openSession: openPrismaSession,
  });

  for (const line of result.lines) {
    console.log(line);
  }

  if (result.hasConflicts) {
    process.exitCode = 1;
  }
};

const parseTargetQuietly = (databaseUrl: string): string => {
  try {
    return parseTarget(databaseUrl).hostname;
  } catch {
    return "";
  }
};

const entryPath = process.argv[1];
const isDirectRun =
  entryPath !== undefined && resolve(entryPath) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error);
    const databaseUrl = process.env.DATABASE_URL ?? "";
    const hostname = databaseUrl === "" ? "" : parseTargetQuietly(databaseUrl);

    console.error(withHostWithheld(raw, hostname));
    process.exitCode = 1;
  });
}
