import { createHash } from "node:crypto";

/**
 * Deterministic CUID-formatted identifier derived from a seed string.
 *
 * `z.string().cuid()` (Zod v3) validates `^c[^\s-]{8,}$`. We produce
 * `c<24-hex>` (25 chars) which is the canonical legacy cuid v1 shape;
 * lowercase hex is a strict subset of cuid's alphabet.
 *
 * Same `seed` → same id (SHA-1 based). Used for cross-referencing the
 * intermediate JSON before Session A maps refs → real Prisma cuids.
 */
export function cuidFromSeed(seed: string): string {
  const hash = createHash("sha1").update(seed).digest("hex");

  return `c${hash.slice(0, 24)}`;
}

export function exerciseCuid(canonicalName: string): string {
  return cuidFromSeed(`exercise::${canonicalName}`);
}

export function rowCuid(blockRef: string, schemaPath: string, rowOrder: number): string {
  return cuidFromSeed(`row::${blockRef}::${schemaPath}::${rowOrder}`);
}

export function alternatingGroupRef(blockRef: string, groupKey: string): string {
  return `${blockRef}-alt-${groupKey}`;
}
