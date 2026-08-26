import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const WORKSPACE_ROOT = join(PACKAGE_ROOT, "..");

const WORKSPACE_SCOPE = "@repo/";

const ENV_SCOPE = "@repo/env";

const ENTRY = join(PACKAGE_ROOT, "scripts/legacy-days-backfill.ts");

const VALUE_EDGE =
  /^[ \t]*(?:import|export)[ \t]+(type[ \t]+)?[\s\S]*?from[ \t]*["']([^"']+)["']/gm;

const SIDE_EFFECT_IMPORT = /^[ \t]*import[ \t]*["']([^"']+)["']/gm;

const RUNTIME_PACKAGES = [
  "node:fs",
  "node:path",
  "node:url",
  "node:crypto",
  "@prisma/client",
  "zod",
];

const asFile = (base: string): string | null =>
  [`${base}.ts`, join(base, "index.ts")].find((candidate) => existsSync(candidate)) ?? null;

const resolveRelative = (fromFile: string, specifier: string): string | null =>
  asFile(resolve(dirname(fromFile), specifier));

const exportsSchema = z.object({ exports: z.record(z.string()) });

const resolveWorkspace = (specifier: string): string | null => {
  const [scope, name, ...rest] = specifier.split("/");
  const packageRoot = join(WORKSPACE_ROOT, name ?? "");
  const manifestPath = join(packageRoot, "package.json");

  if (scope !== "@repo" || !existsSync(manifestPath)) {
    return null;
  }

  const subpath = rest.length === 0 ? "." : `./${rest.join("/")}`;
  const target = exportsSchema.safeParse(JSON.parse(readFileSync(manifestPath, "utf8")));
  const entry = target.success ? target.data.exports[subpath] : undefined;

  return entry === undefined ? null : asFile(join(packageRoot, entry.replace(/\.tsx?$/, "")));
};

type Graph = { files: Set<string>; packages: Set<string>; unresolved: string[] };

const walk = (file: string, graph: Graph): Graph => {
  if (graph.files.has(file)) {
    return graph;
  }

  graph.files.add(file);

  const source = readFileSync(file, "utf8");
  const specifiers = [
    ...[...source.matchAll(VALUE_EDGE)].flatMap((match) =>
      match[1] === undefined && match[2] !== undefined ? [match[2]] : [],
    ),
    ...[...source.matchAll(SIDE_EFFECT_IMPORT)].flatMap((match) =>
      match[1] === undefined ? [] : [match[1]],
    ),
  ];

  for (const specifier of specifiers) {
    if (specifier.startsWith(ENV_SCOPE)) {
      graph.packages.add(specifier);

      continue;
    }

    if (specifier.startsWith(".")) {
      const target = resolveRelative(file, specifier);

      if (target === null) {
        graph.unresolved.push(`${file} -> ${specifier}`);

        continue;
      }

      walk(target, graph);

      continue;
    }

    const workspaceTarget = specifier.startsWith(WORKSPACE_SCOPE)
      ? resolveWorkspace(specifier)
      : null;

    if (workspaceTarget === null) {
      graph.packages.add(specifier);

      continue;
    }

    walk(workspaceTarget, graph);
  }

  return graph;
};

const runtimeGraph = (): Graph =>
  walk(ENTRY, { files: new Set(), packages: new Set(), unresolved: [] });

describe("the days backfill boots with nothing but a DATABASE_URL", () => {
  it("resolves every relative import it reaches", () => {
    expect(runtimeGraph().unresolved).toEqual([]);
  });

  it("reaches more than a handful of files, so the walk is proving something", () => {
    expect(runtimeGraph().files.size).toBeGreaterThan(8);
  });

  it("never reaches an application environment schema at run time", () => {
    const reached = [...runtimeGraph().packages].filter((name) => name.startsWith("@repo/env"));

    expect(reached).toEqual([]);
  });

  it("follows workspace packages rather than stopping at their names", () => {
    const reached = [...runtimeGraph().files].filter((file) =>
      file.includes(join(WORKSPACE_ROOT, "contracts")),
    );

    expect(reached.length).toBeGreaterThan(0);
  });

  it("imports no package beyond the ones an operator CLI needs", () => {
    const unexpected = [...runtimeGraph().packages].filter(
      (name) => !RUNTIME_PACKAGES.includes(name),
    );

    expect(unexpected).toEqual([]);
  });
});
