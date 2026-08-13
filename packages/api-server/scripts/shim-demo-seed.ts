import { PrismaClient } from "@prisma/client";

import { planWindow, toIsoDate, upsertDays, utcMidnight } from "./shim-demo-days";
import {
  buildDemoUniverse,
  DEMO_ATHLETE_EMAIL,
  DEMO_COACH_EMAIL,
  DEMO_LEGACY_USER_ID,
  DEMO_PLAN_NAME,
} from "./shim-demo-universe";

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is required. Export it for this run only, never commit it.`);
  }

  return value;
};

const describeTarget = (databaseUrl: string): string => {
  const parsed = new URL(databaseUrl);

  return `${parsed.host}${parsed.pathname}`;
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
  console.log(`window:         ${days.at(0)?.isoDate} .. ${days.at(-1)?.isoDate}`);
  console.log(
    `days:           ${counts.created} created / ${counts.updated} updated / ${counts.unchanged} unchanged`,
  );
  console.log(`first training: ${firstTraining?.isoDate ?? "none"}`);
  console.log(`first rest:     ${firstRest?.isoDate ?? "none"}`);
};

const main = async (): Promise<void> => {
  const databaseUrl = requireEnv("DATABASE_URL");
  const password = requireEnv("SHIM_DEMO_ATHLETE_PASSWORD");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

  console.log(`target:         ${describeTarget(databaseUrl)}\n`);

  try {
    await run(prisma, password);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
