import { aroundAll, expect } from "vitest";

import { baseEnv } from "@repo/env/base";

import { prisma } from "../db/client";

import { findHeadCoachHolders } from "./head-coach-slot";
import { findTablesGrownSince, takeTableCensus } from "./table-census";
import { assertTestDatabaseTarget } from "./test-database-target";

assertTestDatabaseTarget(baseEnv.DATABASE_URL);
assertTestDatabaseTarget(process.env.DATABASE_URL);

const censusBeforeFile = await takeTableCensus();
const headCoachHoldersBeforeFile = await findHeadCoachHolders();

aroundAll(async (runSuite) => {
  try {
    await runSuite();
  } finally {
    try {
      expect(
        {
          grownTables: await findTablesGrownSince(censusBeforeFile),
          headCoachHolders: await findHeadCoachHolders(),
        },
        "the rows this test file left behind and the head-coach holders (id and updatedAt) it changed",
      ).toEqual({ grownTables: [], headCoachHolders: headCoachHoldersBeforeFile });
    } finally {
      await prisma.$disconnect();
    }
  }
});
