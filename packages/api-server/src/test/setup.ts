import { afterAll, beforeAll, expect } from "vitest";

import { prisma } from "../db/client";

import { findHeadCoachIds } from "./head-coach-slot";
import { describeGrownTables, takeTableCensus, type TableCensus } from "./table-census";

let censusBeforeFile: TableCensus;
let headCoachesBeforeFile: string[];

beforeAll(async () => {
  censusBeforeFile = await takeTableCensus();
  headCoachesBeforeFile = await findHeadCoachIds();
});

afterAll(async () => {
  try {
    expect(
      describeGrownTables(censusBeforeFile, await takeTableCensus()),
      "tables that hold more rows after this test file than before it",
    ).toEqual([]);
    expect(await findHeadCoachIds(), "the head-coach slot changed hands in this test file").toEqual(
      headCoachesBeforeFile,
    );
  } finally {
    await prisma.$disconnect();
  }
});
