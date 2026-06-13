import { type Modifier as PrismaModifier } from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type Modifier } from "@repo/contracts/lms/modifier";

export const mapToModifier = (row: PrismaModifier): Modifier => ({
  id: row.id,
  name: row.name,
  nameLower: row.nameLower,
  notes: row.notes === null ? null : notesListSchema.parse(row.notes),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
