import { type PrismaClient } from "@prisma/client";

import { CATALOG_MEDIA_CELLS } from "./catalog-media";
import { CONNECTOR_POSITION_CELLS } from "./connector-position";
import { EXERCISE_CELLS } from "./exercises";
import { INTENSITY_REST_CELLS } from "./intensity-rest";
import { LOAD_REPS_SIDE_CELLS } from "./load-reps-side";
import { MISC_CELLS } from "./misc";
import { STRUCTURAL_CELLS } from "./structural";
import { type CoverageCell, type CoverageCellResult, type CoverageReport } from "./types";

export {
  type CoverageCategory,
  type CoverageCell,
  type CoverageCellResult,
  type CoverageReport,
} from "./types";

export const COVERAGE_CELLS: readonly CoverageCell[] = [
  ...STRUCTURAL_CELLS,
  ...EXERCISE_CELLS,
  ...LOAD_REPS_SIDE_CELLS,
  ...INTENSITY_REST_CELLS,
  ...CONNECTOR_POSITION_CELLS,
  ...CATALOG_MEDIA_CELLS,
  ...MISC_CELLS,
];

export const tallyCoverage = async (db: PrismaClient, planId: string): Promise<CoverageReport> => {
  const results = await Promise.all(
    COVERAGE_CELLS.map(async (cell): Promise<CoverageCellResult> => {
      const count = await cell.tally(db, planId);

      return { cell, count, satisfied: count >= cell.required };
    }),
  );

  const missing = results.filter((r) => !r.satisfied).map((r) => r.cell);
  const satisfied = results.filter((r) => r.satisfied).length;

  return {
    cells: results,
    missing,
    satisfied,
    total: results.length,
  };
};
