import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getBenchmarkDefinitionsResponseSchema } from "@repo/contracts/lms/benchmark-definition";

import { cleanupRaw } from "../../test/helpers";

import { lmsBenchmarkDefinitionApi } from "./benchmark-definition";

const TEST_PREFIX = `test-benchmark-${crypto.randomUUID().slice(0, 8)}`;

describe("lmsBenchmarkDefinitionApi.getAll — empty DB", () => {
  beforeAll(async () => {
    await cleanupRaw.benchmarkDefinition.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await cleanupRaw.benchmarkDefinition.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
  });

  it("returns no items matching the test prefix", async () => {
    const result = await lmsBenchmarkDefinitionApi.getAll();
    const filtered = result.filter((item) => item.name.startsWith(TEST_PREFIX));

    expect(filtered).toHaveLength(0);
  });

  it("result validates against response schema", async () => {
    const result = await lmsBenchmarkDefinitionApi.getAll();
    const parsed = getBenchmarkDefinitionsResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });

  it("result is always an array", async () => {
    const result = await lmsBenchmarkDefinitionApi.getAll();

    expect(Array.isArray(result)).toBe(true);
  });
});
