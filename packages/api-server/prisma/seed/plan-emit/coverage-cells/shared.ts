import { type Prisma, type PrismaClient } from "@prisma/client";

export const schemaWhere = (planId: string): Prisma.SchemaWhereInput => ({
  block: { session: { day: { week: { planId } } } },
});

export const schemaRowWhere = (planId: string): Prisma.SchemaRowWhereInput => ({
  schema: { block: { session: { day: { week: { planId } } } } },
});

export const blockWhere = (planId: string): Prisma.BlockWhereInput => ({
  session: { day: { week: { planId } } },
});

export const sessionWhere = (planId: string): Prisma.SessionWhereInput => ({
  day: { week: { planId } },
});

export const dayWhere = (planId: string): Prisma.DayWhereInput => ({
  week: { planId },
});

export const weekWhere = (planId: string): Prisma.WeekWhereInput => ({
  planId,
});

export const countSchema = async (
  db: PrismaClient,
  planId: string,
  extra: Prisma.SchemaWhereInput,
): Promise<number> =>
  db.schema.count({
    where: { ...schemaWhere(planId), ...extra },
  });

export const countSchemaRow = async (
  db: PrismaClient,
  planId: string,
  extra: Prisma.SchemaRowWhereInput,
): Promise<number> =>
  db.schemaRow.count({
    where: { ...schemaRowWhere(planId), ...extra },
  });

export const countBlock = async (
  db: PrismaClient,
  planId: string,
  extra: Prisma.BlockWhereInput,
): Promise<number> =>
  db.block.count({
    where: { ...blockWhere(planId), ...extra },
  });

export const countSession = async (
  db: PrismaClient,
  planId: string,
  extra: Prisma.SessionWhereInput,
): Promise<number> =>
  db.session.count({
    where: { ...sessionWhere(planId), ...extra },
  });

export const countDay = async (
  db: PrismaClient,
  planId: string,
  extra: Prisma.DayWhereInput,
): Promise<number> =>
  db.day.count({
    where: { ...dayWhere(planId), ...extra },
  });

export const STRUCTURAL_PARALLEL_FLOOR = 4;

const isRepetitionAbsentOrOnce = (repetition: Prisma.JsonValue | undefined): boolean =>
  repetition === undefined ||
  (repetition !== null &&
    typeof repetition === "object" &&
    !Array.isArray(repetition) &&
    repetition.kind === "once");

export const isDerivedParallelComposition = (composition: Prisma.JsonValue): boolean =>
  composition !== null &&
  typeof composition === "object" &&
  !Array.isArray(composition) &&
  isRepetitionAbsentOrOnce(composition.repetition) &&
  !("arrangement" in composition);

export const countStructurallyParallelParents = async (
  db: PrismaClient,
  planId: string,
): Promise<number> => {
  const grouped = await db.schema.groupBy({
    by: ["parentSchemaId"],
    where: { ...schemaWhere(planId), parentSchemaId: { not: null } },
    _count: { parentSchemaId: true },
  });

  const parentIds = grouped.flatMap((group) =>
    group.parentSchemaId !== null && group._count.parentSchemaId >= 2 ? [group.parentSchemaId] : [],
  );

  if (parentIds.length === 0) {
    return 0;
  }

  const parents = await db.schema.findMany({
    where: { ...schemaWhere(planId), id: { in: parentIds } },
    select: { id: true, composition: true },
  });

  return parents.filter((parent) => isDerivedParallelComposition(parent.composition)).length;
};
