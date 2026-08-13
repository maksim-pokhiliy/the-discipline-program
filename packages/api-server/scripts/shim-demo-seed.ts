import { PrismaClient } from "@prisma/client";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { planWindow, toIsoDate, upsertDays, utcMidnight } from "./shim-demo-days";
import {
  buildDemoUniverse,
  DEMO_ATHLETE_EMAIL,
  DEMO_COACH_EMAIL,
  DEMO_LEGACY_USER_ID,
  DEMO_PLAN_NAME,
} from "./shim-demo-universe";

const EXPECT_HOST_FLAG = "--expect-host=";

const readFlag = (prefix: string): string | null => {
  const arg = process.argv.find((candidate) => candidate.startsWith(prefix));

  return arg === undefined ? null : arg.slice(prefix.length);
};

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} is required. Export it for this run only, never commit it.`);
  }

  return value;
};

const requirePassword = (): string => {
  const password = requireEnv("SHIM_DEMO_ATHLETE_PASSWORD");

  if (password.trim() !== password) {
    throw new Error(
      "SHIM_DEMO_ATHLETE_PASSWORD has leading or trailing whitespace. That whitespace is part " +
        "of the credential and would silently lock the stand out; strip it and re-run.",
    );
  }

  if (
    password.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH ||
    password.length > AUTH_CONSTANTS.MAX_PASSWORD_LENGTH
  ) {
    throw new Error(
      `SHIM_DEMO_ATHLETE_PASSWORD must be ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH}..` +
        `${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} characters, the same policy every other ` +
        "password path in this project enforces.",
    );
  }

  return password;
};

const parseTarget = (databaseUrl: string): URL => {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL is not a parseable URL. Its value is deliberately not printed — check the " +
        "variable you exported.",
    );
  }
};

const requireExpectedHost = (target: URL): void => {
  const expected = readFlag(EXPECT_HOST_FLAG);

  if (expected === null) {
    throw new Error(
      `--write requires ${EXPECT_HOST_FLAG}<hostname>. Importing @prisma/client loads any .env ` +
        "beside it, so DATABASE_URL can arrive from a file you did not name; stating the host " +
        `you expect is what makes the target deliberate. This run resolved ${target.hostname}.`,
    );
  }

  if (expected !== target.hostname) {
    throw new Error(
      `refusing to write: --expect-host=${expected} does not match the resolved host ` +
        `${target.hostname}.`,
    );
  }
};

const run = async (prisma: PrismaClient, password: string): Promise<void> => {
  const universe = await buildDemoUniverse(prisma, password);
  const runDate = utcMidnight(toIsoDate(new Date()));
  const days = planWindow(runDate);
  const counts = await upsertDays(prisma, universe.linkId, days);
  const firstTraining = days.find((day) => !day.isRestDay && day.scheduledDate >= runDate);
  const firstRest = days.find((day) => day.isRestDay && day.scheduledDate >= runDate);

  console.log(`coach:          ${DEMO_COACH_EMAIL}`);
  console.log(`athlete:        ${DEMO_ATHLETE_EMAIL} (legacyUserId ${DEMO_LEGACY_USER_ID})`);
  console.log(`plan:           ${universe.planId} "${DEMO_PLAN_NAME}"`);
  console.log(`link:           ${universe.linkId} INDIVIDUAL`);
  console.log(`identity:       refreshed, athlete password rewritten from the env var`);
  console.log(`window:         ${days.at(0)?.isoDate} .. ${days.at(-1)?.isoDate}`);
  console.log(
    `days:           ${counts.created} created / ${counts.updated} updated / ${counts.unchanged} unchanged`,
  );
  console.log(`first training: ${firstTraining?.isoDate ?? "none"}`);
  console.log(`first rest:     ${firstRest?.isoDate ?? "none"}`);
};

const dryRun = (target: URL): void => {
  const days = planWindow(utcMidnight(toIsoDate(new Date())));
  const restDays = days.filter((day) => day.isRestDay).length;

  console.log("mode:           DRY-RUN, nothing was written\n");
  console.log(`coach:          ${DEMO_COACH_EMAIL}`);
  console.log(`athlete:        ${DEMO_ATHLETE_EMAIL} (legacyUserId ${DEMO_LEGACY_USER_ID})`);
  console.log(`plan:           "${DEMO_PLAN_NAME}"`);
  console.log(`window:         ${days.at(0)?.isoDate} .. ${days.at(-1)?.isoDate}`);
  console.log(`days:           ${days.length} total, ${restDays} rest`);
  console.log(
    `\nRe-run with --write ${EXPECT_HOST_FLAG}${target.hostname} to apply, ` +
      "after confirming that host is the database you meant.",
  );
};

const main = async (): Promise<void> => {
  const databaseUrl = requireEnv("DATABASE_URL");
  const password = requirePassword();
  const target = parseTarget(databaseUrl);
  const isWriting = process.argv.includes("--write");

  console.log(`target:         ${target.host}${target.pathname}\n`);

  if (!isWriting) {
    dryRun(target);

    return;
  }

  requireExpectedHost(target);

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

  try {
    await run(prisma, password);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
