import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface BlockLocation {
  sheet: string;
  day: string;
  session: string;
  rowStart: number;
  rowEnd: number;
}

export interface BlockInventoryEntry {
  ref: string;
  label: string;
  locations: BlockLocation[];
  rawBody: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = resolve(
  __dirname,
  "../../../../../../../analysis/artifacts/01-inventory/block-instances.md",
);

const BLOCK_HEADER_RE = /^### (block-\d{3})\s*$/m;
const LOCATION_RE = /^- (sheet-\d{2}) \/ ([A-Z]+) \/ ([^()]+?)\s*\(rows (\d+)-(\d+)\)\s*$/;

export function parseInventory(): Map<string, BlockInventoryEntry> {
  const text = readFileSync(INVENTORY_PATH, "utf8");
  const lines = text.split("\n");
  const map = new Map<string, BlockInventoryEntry>();

  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const match = line.match(BLOCK_HEADER_RE);

    if (!match) {
      i++;
      continue;
    }

    const ref = match[1]!;

    i++;

    // skip blank line
    while (i < lines.length && (lines[i] ?? "").trim() === "") {
      i++;
    }

    // block-label line
    const labelLine = lines[i] ?? "";
    const labelMatch = labelLine.match(/^block-label:\s*`(.+)`\s*$/);

    if (!labelMatch) {
      throw new Error(`Missing block-label for ${ref}: line ${i + 1}: ${labelLine}`);
    }

    const label = labelMatch[1]!;

    i++;

    // locations (N): line
    while (i < lines.length && !(lines[i] ?? "").match(/^locations \(\d+\):/)) {
      i++;
    }

    if (i >= lines.length) {
      throw new Error(`Missing locations for ${ref}`);
    }

    i++;

    const locations: BlockLocation[] = [];

    while (i < lines.length) {
      const locLine = (lines[i] ?? "").trim();

      if (locLine.startsWith("- sheet-")) {
        const lm = locLine.match(LOCATION_RE);

        if (!lm) {
          throw new Error(`Bad location line for ${ref}: ${locLine}`);
        }

        locations.push({
          sheet: lm[1]!,
          day: lm[2]!,
          session: lm[3]!.trim(),
          rowStart: parseInt(lm[4]!, 10),
          rowEnd: parseInt(lm[5]!, 10),
        });
        i++;
        continue;
      }

      // "raw:" follows location list (may be indented)
      if (locLine === "raw:" || (lines[i] ?? "").trim() === "raw:") {
        i++;
        break;
      }

      if (locLine === "") {
        i++;
        continue;
      }

      throw new Error(`Unexpected line in locations for ${ref}: ${locLine}`);
    }

    // skip blanks until ``` fence
    while (i < lines.length && (lines[i] ?? "").trim() !== "```") {
      i++;
    }

    if (i >= lines.length) {
      throw new Error(`Missing raw fence for ${ref}`);
    }

    i++; // skip opening ```

    const bodyLines: string[] = [];

    while (i < lines.length && (lines[i] ?? "") !== "```") {
      bodyLines.push(lines[i] ?? "");
      i++;
    }

    if (i >= lines.length) {
      throw new Error(`Unterminated raw body for ${ref}`);
    }

    i++; // skip closing ```

    const rawBody = bodyLines.join("\n");
    const normalisedBody = rawBody.trim() === "(empty body)" ? "" : rawBody;

    map.set(ref, { ref, label, locations, rawBody: normalisedBody });
  }

  if (map.size !== 198) {
    throw new Error(`Expected 198 block instances, parsed ${map.size}`);
  }

  return map;
}
