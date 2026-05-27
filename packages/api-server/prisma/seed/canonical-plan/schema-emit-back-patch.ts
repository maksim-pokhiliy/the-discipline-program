import { type Prisma, type PrismaClient } from "@prisma/client";

import { type CanonicalSchemaNode } from "../_canonical/canonical-schema";

import { type RefResolver } from "./ref-resolver";

type CanonicalArchetypeParams = CanonicalSchemaNode["archetype"];

const substitutePairedLadders = (
  params: CanonicalArchetypeParams,
  resolver: RefResolver,
): CanonicalArchetypeParams => {
  if (
    params.archetype !== "parallel-ladders-descending" &&
    params.archetype !== "parallel-ladders-mixed-direction"
  ) {
    return params;
  }

  return {
    ...params,
    params: {
      ...params.params,
      ladders: params.params.ladders.map((ladder) =>
        ladder.pairedWithInnerRowId === undefined
          ? ladder
          : { ...ladder, pairedWithInnerRowId: resolver.getRow(ladder.pairedWithInnerRowId) },
      ),
    },
  };
};

const substitutePyramids = (
  params: CanonicalArchetypeParams,
  resolver: RefResolver,
): CanonicalArchetypeParams => {
  if (params.archetype !== "parallel-pyramids") {
    return params;
  }

  return {
    ...params,
    params: {
      ...params.params,
      pyramids: params.params.pyramids.map((pyramid) =>
        pyramid.pairedWithInnerRowId === undefined
          ? pyramid
          : { ...pyramid, pairedWithInnerRowId: resolver.getRow(pyramid.pairedWithInnerRowId) },
      ),
    },
  };
};

const substituteSuperSet = (
  params: CanonicalArchetypeParams,
  resolver: RefResolver,
): CanonicalArchetypeParams => {
  if (params.archetype !== "super-set") {
    return params;
  }

  return {
    ...params,
    params: {
      ...params.params,
      pairs: params.params.pairs.map((pair) => ({
        ...pair,
        schemaRows: pair.schemaRows.map((ref) => resolver.getRow(ref)),
      })),
    },
  };
};

export const hasRowRefs = (params: CanonicalArchetypeParams): boolean =>
  params.archetype === "parallel-ladders-descending" ||
  params.archetype === "parallel-ladders-mixed-direction" ||
  params.archetype === "parallel-pyramids" ||
  params.archetype === "super-set";

export const backPatchSchema = async (
  db: PrismaClient,
  schemaId: string,
  params: CanonicalArchetypeParams,
  resolver: RefResolver,
): Promise<void> => {
  let substituted = substitutePairedLadders(params, resolver);

  substituted = substitutePyramids(substituted, resolver);
  substituted = substituteSuperSet(substituted, resolver);

  await db.schema.update({
    where: { id: schemaId },
    data: { archetypeParams: substituted satisfies Prisma.InputJsonValue },
  });
};
