import { type PrismaClient } from "@prisma/client";

import {
  type CanonicalBlock,
  type CanonicalSeed,
  isCanonicalGroupItem,
} from "../plan-data/canonical-schema";

import { seedCanonicalBlocks } from "./block-emit";
import { seedCanonicalCatalog } from "./catalog-emit";
import { loadCanonicalSeed } from "./load-and-validate";
import { seedCanonicalPlanShell } from "./plan-emit";
import { createRefResolver } from "./ref-resolver";
import { seedCanonicalSchemas } from "./schema-emit";

export { COVERAGE_CELLS, tallyCoverage } from "./coverage-cells";
export type {
  CoverageCategory,
  CoverageCell,
  CoverageCellResult,
  CoverageReport,
} from "./coverage-cells";

export type SeedCanonicalPlanResult = {
  demoPlanId: string;
  counts: {
    exercises: number;
    labels: number;
    weeks: number;
    sessions: number;
    blocks: number;
    schemas: number;
    rows: number;
  };
};

const countRowsInBlock = (block: CanonicalBlock): number =>
  block.schemas.reduce((total, item) => {
    const members = isCanonicalGroupItem(item) ? item.group.members : [item];

    return total + members.reduce((sum, member) => sum + member.rows.length, 0);
  }, 0);

const countRowsInSeed = (seed: CanonicalSeed): number => {
  let total = 0;

  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          total += countRowsInBlock(block);
        }
      }
    }
  }

  for (const example of seed.phase7Examples) {
    for (const block of example.blocks) {
      total += countRowsInBlock(block);
    }
  }

  return total;
};

const countWeeks = (seed: CanonicalSeed): number =>
  seed.weeks.length + (seed.phase7Examples.length > 0 ? 1 : 0);

const buildLabelMap = (
  catalog: CanonicalSeed["catalog"],
  getLabel: (ref: string) => string,
): ReadonlyMap<string, string> =>
  new Map(catalog.labels.map((entry) => [entry.ref, getLabel(entry.ref)]));

export const seedCanonicalPlan = async (
  db: PrismaClient,
  coachId: string,
): Promise<SeedCanonicalPlanResult> => {
  console.log("Seeding canonical plan...");

  const seed = await loadCanonicalSeed();
  const resolver = createRefResolver();

  const { exerciseCount, labelCount } = await seedCanonicalCatalog(db, seed.catalog, resolver);
  const labelMap = buildLabelMap(seed.catalog, resolver.getLabel);

  const { demoPlanId, sessionRefs } = await seedCanonicalPlanShell(db, seed, coachId, labelMap);
  const { blockRefs } = await seedCanonicalBlocks(db, seed, sessionRefs, resolver);

  const { schemaCount } = await seedCanonicalSchemas(db, seed, blockRefs, resolver);

  const counts: SeedCanonicalPlanResult["counts"] = {
    exercises: exerciseCount,
    labels: labelCount,
    weeks: countWeeks(seed),
    sessions: sessionRefs.size,
    blocks: blockRefs.size,
    schemas: schemaCount,
    rows: countRowsInSeed(seed),
  };

  console.log(
    `Canonical plan seeded — plan ${demoPlanId}: ${counts.weeks} weeks, ${counts.sessions} sessions, ${counts.blocks} blocks, ${counts.schemas} schemas, ${counts.rows} rows.`,
  );

  return { demoPlanId, counts };
};
