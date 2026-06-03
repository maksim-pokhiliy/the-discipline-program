import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));

const SCHEMA_PRISMA_PATH = join(TEST_DIR, "..", "..", "prisma", "schema.prisma");

const STORED_LABEL_FIELD_PATTERN = /^\s*(derivedKind|derivedFamily|label)\s+\w/m;

const COMPOSITION_COLUMN_PATTERN = /^\s*composition\s+Json\?/m;

const extractModelSchemaBlock = (source: string): string => {
  const start = source.indexOf("model Schema {");

  expect(start).toBeGreaterThanOrEqual(0);

  const end = source.indexOf("\n}", start);

  expect(end).toBeGreaterThan(start);

  return source.slice(start, end + 2);
};

describe("derived composition label is computed-on-read, never persisted (DEC-2, OQ-1)", () => {
  const source = readFileSync(SCHEMA_PRISMA_PATH, "utf8");
  const schemaBlock = extractModelSchemaBlock(source);

  it("declares the additive nullable composition column (positive control — 10.2 column present)", () => {
    expect(COMPOSITION_COLUMN_PATTERN.test(schemaBlock)).toBe(true);
  });

  it("declares no stored derivedKind / derivedFamily / label column on the Schema model", () => {
    expect(STORED_LABEL_FIELD_PATTERN.test(schemaBlock)).toBe(false);
  });
});
