import { type PrismaClient } from "@prisma/client";

import { type CanonicalSchemaNode, type CanonicalSeed } from "../_canonical/canonical-schema";
import { requireId } from "../_id-helpers";

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

const countRowsInNode = (node: CanonicalSchemaNode): number => {
  let total = node.rows.length;

  for (const sub of node.subSchemas) {
    total += countRowsInNode(sub);
  }

  return total;
};

const countRowsInSeed = (seed: CanonicalSeed): number => {
  let total = 0;

  for (const week of seed.weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          for (const schema of block.schemas) {
            total += countRowsInNode(schema);
          }
        }
      }
    }
  }

  for (const example of seed.phase7Examples) {
    for (const block of example.blocks) {
      for (const schema of block.schemas) {
        total += countRowsInNode(schema);
      }
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

const buildArchetypeIdByName = async (db: PrismaClient): Promise<ReadonlyMap<string, string>> => {
  const archetypes = await db.archetype.findMany();

  return new Map(archetypes.map((row) => [row.name, requireId(row)]));
};

export const seedCanonicalPlan = async (
  db: PrismaClient,
  coachId: string,
): Promise<SeedCanonicalPlanResult> => {
  console.log("Seeding canonical Demo Plan...");

  const seed = await loadCanonicalSeed();
  const resolver = createRefResolver();

  const { exerciseCount, labelCount } = await seedCanonicalCatalog(db, seed.catalog, resolver);
  const labelMap = buildLabelMap(seed.catalog, resolver.getLabel);

  const { demoPlanId, sessionRefs } = await seedCanonicalPlanShell(db, seed, coachId, labelMap);
  const { blockRefs, altGroupRefs } = await seedCanonicalBlocks(db, seed, sessionRefs, resolver);

  const archetypeIdByName = await buildArchetypeIdByName(db);
  const { schemaCount } = await seedCanonicalSchemas(
    db,
    seed,
    blockRefs,
    altGroupRefs,
    archetypeIdByName,
    resolver,
  );

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
    `Canonical Demo Plan seeded — plan ${demoPlanId}: ${counts.weeks} weeks, ${counts.sessions} sessions, ${counts.blocks} blocks, ${counts.schemas} schemas, ${counts.rows} rows.`,
  );

  return { demoPlanId, counts };
};
