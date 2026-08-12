import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const DI_IMPORT = "instrumentation/ensure-di";

const EXEMPT_SUBPATHS = new Set([
  "./instrumentation",
  "./idempotency",
  "./infrastructure/monitoring",
  "./test-helpers",
  "./test-helpers/published-snapshot",
]);

const manifestSchema = z.object({ exports: z.record(z.string()) });

const readRequestServingSubpaths = (): Array<[string, string]> => {
  const manifest = manifestSchema.parse(
    JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")),
  );

  return Object.entries(manifest.exports).filter(([subpath]) => !EXEMPT_SUBPATHS.has(subpath));
};

describe("exported api-server entry points bootstrap dependency injection", () => {
  it("every request-serving subpath export imports ensure-di", () => {
    const subpaths = readRequestServingSubpaths();

    expect(subpaths.length).toBeGreaterThan(5);

    const missing = subpaths
      .filter(([, target]) => !readFileSync(join(PACKAGE_ROOT, target), "utf8").includes(DI_IMPORT))
      .map(([subpath]) => subpath);

    expect(missing).toEqual([]);
  });

  it("exempts only entry points that cannot serve a request on their own", () => {
    const manifest = manifestSchema.parse(
      JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")),
    );

    for (const subpath of EXEMPT_SUBPATHS) {
      expect(Object.keys(manifest.exports)).toContain(subpath);
    }
  });
});
