import { afterAll, beforeAll, expect } from "vitest";

import { prisma } from "../db/client";

import { describeGrownTables, takeTableCensus, type TableCensus } from "./table-census";

let censusBeforeFile: TableCensus;

beforeAll(async () => {
  censusBeforeFile = await takeTableCensus();
});

afterAll(async () => {
  try {
    expect(
      describeGrownTables(censusBeforeFile, await takeTableCensus()),
      "tables that hold more rows after this test file than before it",
    ).toEqual([]);
  } finally {
    await prisma.$disconnect();
  }
});
