import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const DI_IMPORT = "instrumentation/ensure-di";

const ENDPOINTS_PREFIX = "./src/endpoints/";

const readExportedEndpointBarrels = (): string[] => {
  const manifest: unknown = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"));

  if (typeof manifest !== "object" || manifest === null || !("exports" in manifest)) {
    throw new Error("api-server package.json has no exports map");
  }

  const exportsMap = (manifest as { exports: Record<string, string> }).exports;

  return Object.values(exportsMap).filter((target) => target.startsWith(ENDPOINTS_PREFIX));
};

describe("exported endpoint barrels bootstrap dependency injection", () => {
  it("every endpoints barrel reachable from the package exports map imports ensure-di", () => {
    const barrels = readExportedEndpointBarrels();

    expect(barrels.length).toBeGreaterThan(5);

    const missing = barrels.filter(
      (barrel) => !readFileSync(join(PACKAGE_ROOT, barrel), "utf8").includes(DI_IMPORT),
    );

    expect(missing).toEqual([]);
  });
});
