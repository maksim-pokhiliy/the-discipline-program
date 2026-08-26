import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { legacyDailyProgramSchema } from "../src/endpoints/mobile-compat/wire-schemas";

import { backfillDailyProgramSchema } from "./legacy-days-backfill-source";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const resolveModule = (fromFile: string, specifier: string): string | null => {
  const base = resolve(dirname(fromFile), specifier);

  return [`${base}.ts`, join(base, "index.ts")].find((candidate) => existsSync(candidate)) ?? null;
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
    if (!specifier.startsWith(".")) {
      graph.packages.add(specifier);

      continue;
    }

    const target = resolveModule(file, specifier);

    if (target === null) {
      graph.unresolved.push(`${file} -> ${specifier}`);

      continue;
    }

    walk(target, graph);
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

  it("imports no package beyond the ones an operator CLI needs", () => {
    const unexpected = [...runtimeGraph().packages].filter(
      (name) => !RUNTIME_PACKAGES.includes(name),
    );

    expect(unexpected).toEqual([]);
  });
});

const PROGRAM_SHAPES: readonly [string, unknown][] = [
  [
    "a training day",
    { dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "A", exercises: ["x"] }] }] },
  ],
  ["a day with no trainings", { dayTrainings: [] }],
  ["a training with no blocks", { dayTrainings: [{ trainingNumber: 1, blocks: [] }] }],
  [
    "a block with no exercises",
    { dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "A", exercises: [] }] }] },
  ],
  [
    "several trainings",
    {
      dayTrainings: [
        { trainingNumber: 1, blocks: [{ name: "A", exercises: ["x"] }] },
        { trainingNumber: 2, blocks: [{ name: "B", exercises: ["y", "z"] }] },
      ],
    },
  ],
  ["a fractional training number", { dayTrainings: [{ trainingNumber: 1.5, blocks: [] }] }],
  ["no dayTrainings at all", {}],
  ["dayTrainings that is not a list", { dayTrainings: "one" }],
  ["a training with no number", { dayTrainings: [{ blocks: [] }] }],
  [
    "a numeric training number as a string",
    { dayTrainings: [{ trainingNumber: "1", blocks: [] }] },
  ],
  ["a block with no name", { dayTrainings: [{ trainingNumber: 1, blocks: [{ exercises: [] }] }] }],
  [
    "exercises that are not strings",
    {
      dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "A", exercises: [1] }] }],
    },
  ],
  [
    "an extra field on a block",
    {
      dayTrainings: [
        { trainingNumber: 1, blocks: [{ name: "A", exercises: ["x"], note: "kept" }] },
      ],
    },
  ],
  ["an extra field at the top", { dayTrainings: [], version: 2 }],
  ["null", null],
  ["a list", []],
  ["a string", "not a program"],
];

describe("the backfill's program schema and the one the shim serves through", () => {
  it.each(PROGRAM_SHAPES)("agree on %s", (_name, body) => {
    const shim = legacyDailyProgramSchema.safeParse(body);
    const backfill = backfillDailyProgramSchema.safeParse(body);

    expect(backfill.success).toBe(shim.success);

    if (shim.success && backfill.success) {
      expect(backfill.data).toEqual(shim.data);
    }
  });
});
