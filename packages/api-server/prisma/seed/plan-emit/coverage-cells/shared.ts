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
