import "./refuse-non-test-database";

import { aroundAll, expect } from "vitest";

import { baseEnv } from "@repo/env/base";

import { prisma } from "../db/client";

import { takeFileBaseline } from "./file-baseline";
import { findHeadCoachHolders } from "./head-coach-slot";
import { findTablesGrownSince } from "./table-census";
import { assertTestDatabaseTarget } from "./test-database-target";

assertTestDatabaseTarget(baseEnv.DATABASE_URL);

const baseline = await takeFileBaseline();

aroundAll(async (runSuite) => {
  try {
    await runSuite();
  } finally {
    try {
      expect(
        {
          grownTables: await findTablesGrownSince(baseline.census),
          headCoachHolders: await findHeadCoachHolders(),
        },
        "the rows this test file left behind and the head-coach holders (id and updatedAt) it changed",
      ).toEqual({ grownTables: [], headCoachHolders: baseline.headCoachHolders });
    } finally {
      await prisma.$disconnect();
    }
  }
});
