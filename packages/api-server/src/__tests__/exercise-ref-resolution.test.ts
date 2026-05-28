import { describe, expect, it } from "vitest";

import { exerciseCuid } from "../../prisma/seed/_canonical/builder";
import { canonicalSeedSchema } from "../../prisma/seed/_canonical/canonical-schema";
import { SYNTHETIC_DEMO_PLAN } from "../../prisma/seed/_canonical/plan-synthetic";
import { loadCanonicalSeed } from "../../prisma/seed/canonical-plan/load-and-validate";

import { collectExerciseRefs } from "./_seed-coverage-helpers";

describe("Exercise-ref resolution — parse time (QA-001 regression, no DB)", () => {
  it("Zod safeParse of SYNTHETIC_DEMO_PLAN succeeds (builder/schema drift guard, MT-12)", () => {
    const result = canonicalSeedSchema.safeParse(SYNTHETIC_DEMO_PLAN);

    expect(result.success).toBe(true);
  });

  it("loadCanonicalSeed() resolves without throwing (X1 assertExerciseRefsResolve passes)", async () => {
    await expect(loadCanonicalSeed()).resolves.toBeDefined();
  });

  it("every embedded exercise ref resolves to a catalog exerciseCuid (QA-2 parse layer)", async () => {
    const seed = await loadCanonicalSeed();

    const catalogIds = new Set(
      seed.catalog.exercises.map((entry) => exerciseCuid(entry.canonicalName)),
    );

    expect(catalogIds.size).toBe(seed.catalog.exercises.length);

    const referenced = new Set<string>();

    collectExerciseRefs(seed.weeks, referenced);
    collectExerciseRefs(seed.phase7Examples, referenced);

    expect(referenced.size).toBeGreaterThan(0);

    const orphans = [...referenced].filter((ref) => !catalogIds.has(ref));

    expect(orphans).toEqual([]);
  });
});
