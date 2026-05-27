import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ArchetypeSubAssign {
  subOrder: number;
  archetype: string;
}

export interface ArchetypeAssign {
  schemaOrder: number;
  archetype: string;
  subSchemas: ArchetypeSubAssign[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = resolve(
  __dirname,
  "../../../../../../../analysis/artifacts/02-patterns/schema-archetype-mapping.md",
);

const BLOCK_HEADER_RE = /^### (block-\d{3})\s*\(/;
const SCHEMA_RE = /^- schema-(\d+) → archetype-(\S+)\s*$/;
const SUB_SCHEMA_RE = /^\s+- sub-(\d+) → archetype-(\S+)\s*$/;
const EMPTY_BODY_RE = /^- \(empty body, no schemas\)\s*$/;

export function parseArchetypeMapping(): Map<string, ArchetypeAssign[]> {
  const text = readFileSync(MAPPING_PATH, "utf8");
  const lines = text.split("\n");
  const map = new Map<string, ArchetypeAssign[]>();

  let currentBlock: string | null = null;
  let currentList: ArchetypeAssign[] | null = null;

  for (const raw of lines) {
    const line = raw;
    const blockMatch = line.match(BLOCK_HEADER_RE);

    if (blockMatch) {
      currentBlock = blockMatch[1]!;
      currentList = [];
      map.set(currentBlock, currentList);
      continue;
    }

    if (currentBlock == null || currentList == null) {
      continue;
    }

    if (line.match(EMPTY_BODY_RE)) {
      continue;
    }

    const subMatch = line.match(SUB_SCHEMA_RE);

    if (subMatch) {
      const subOrder = parseInt(subMatch[1]!, 10);
      const archetype = subMatch[2]!;
      const last = currentList.at(-1);

      if (!last) {
        throw new Error(`Sub-schema for ${currentBlock} without parent`);
      }

      last.subSchemas.push({ subOrder, archetype });
      continue;
    }

    const schemaMatch = line.match(SCHEMA_RE);

    if (schemaMatch) {
      currentList.push({
        schemaOrder: parseInt(schemaMatch[1]!, 10),
        archetype: schemaMatch[2]!,
        subSchemas: [],
      });
      continue;
    }
  }

  if (map.size !== 198) {
    throw new Error(`Expected 198 block entries, got ${map.size}`);
  }

  return map;
}
