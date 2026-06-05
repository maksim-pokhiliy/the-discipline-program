import { createHash } from "node:crypto";

export const CUID_HEX_LENGTH = 24;
export const CUID_LENGTH = CUID_HEX_LENGTH + 1;
export const CUID_REGEX = /^c[0-9a-f]{24}$/;

const assertCuidFormat = (value: string, seed: string): void => {
  if (!CUID_REGEX.test(value)) {
    throw new Error(
      `cuid format violated: produced "${value}" from seed "${seed}" (expected ${CUID_REGEX.source})`,
    );
  }
};

export const cuidFromSeed = (seed: string): string => {
  if (seed.length === 0) {
    throw new Error('cuidFromSeed: empty seed (value="")');
  }

  const hash = createHash("sha1").update(seed).digest("hex");
  const id = `c${hash.slice(0, CUID_HEX_LENGTH)}`;

  assertCuidFormat(id, seed);

  return id;
};

export const exerciseCuid = (canonicalName: string): string => {
  if (canonicalName.length === 0) {
    throw new Error('exerciseCuid: empty canonicalName (value="")');
  }

  return cuidFromSeed(`exercise::${canonicalName}`);
};

export const rowCuid = (blockRef: string, schemaPath: string, rowOrder: number): string => {
  if (blockRef.length === 0 || schemaPath.length === 0) {
    throw new Error(
      `rowCuid: empty ref segment (blockRef="${blockRef}", schemaPath="${schemaPath}", rowOrder=${rowOrder})`,
    );
  }

  if (!Number.isInteger(rowOrder) || rowOrder <= 0) {
    throw new Error(`rowCuid: rowOrder must be a positive integer (got ${rowOrder})`);
  }

  return cuidFromSeed(`row::${blockRef}::${schemaPath}::${rowOrder}`);
};
