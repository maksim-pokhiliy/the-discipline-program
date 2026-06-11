import { type SchemaGroup as PrismaSchemaGroup } from "@prisma/client";
import { z } from "zod";

import { PARALLEL_INTERLEAVE_ORDERS, type SchemaGroup } from "@repo/contracts/lms/schema-group";

const interleaveOrderSchema = z.enum(PARALLEL_INTERLEAVE_ORDERS);

export const mapToSchemaGroup = (g: PrismaSchemaGroup): SchemaGroup => ({
  id: g.id,
  blockId: g.blockId,
  label: g.label,
  interleaveOrder: interleaveOrderSchema.parse(g.interleaveOrder),
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
});
