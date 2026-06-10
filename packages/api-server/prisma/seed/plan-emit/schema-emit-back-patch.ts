import { type Prisma, type PrismaClient } from "@prisma/client";

import type { ArrangementAxis, Composition } from "@repo/contracts/lms/composition";

import { type RefResolver } from "./ref-resolver";

type SeedArrangement = NonNullable<Composition["arrangement"]>;

const resolveArrangement = (
  arrangement: SeedArrangement,
  resolver: RefResolver,
): ArrangementAxis => {
  switch (arrangement.kind) {
    case "ordered":
      return arrangement;
    case "superset":
      return {
        kind: "superset",
        pairs: arrangement.pairs.map((pair) => ({
          label: pair.label,
          rowIds: pair.rowIds.map((rowRef) => resolver.getRow(rowRef)),
        })),
      };
    default:
      return arrangement satisfies never;
  }
};

export const arrangementHasRefs = (arrangement: SeedArrangement | undefined): boolean =>
  arrangement !== undefined && arrangement.kind === "superset";

export const backPatchComposition = async (
  db: PrismaClient,
  schemaId: string,
  composition: Composition,
  resolver: RefResolver,
): Promise<void> => {
  if (composition.arrangement === undefined) {
    return;
  }

  const resolved = resolveArrangement(composition.arrangement, resolver);

  await db.schema.update({
    where: { id: schemaId },
    data: {
      composition: { ...composition, arrangement: resolved } satisfies Prisma.InputJsonValue,
    },
  });
};
