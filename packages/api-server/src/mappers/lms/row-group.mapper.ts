import { type RowGroup as PrismaRowGroup } from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type RowGroup } from "@repo/contracts/lms/row-group";

export const mapToRowGroup = (g: PrismaRowGroup): RowGroup => ({
  id: g.id,
  schemaId: g.schemaId,
  notes: g.notes === null ? null : notesListSchema.parse(g.notes),
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
});
