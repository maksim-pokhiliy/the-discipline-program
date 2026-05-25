import { type Label as PrismaLabel } from "@prisma/client";

import { type AppLevelValue, type Label } from "@repo/contracts/lms/label";

export const mapToLabel = (row: PrismaLabel): Label => ({
  id: row.id,
  name: row.name,
  nameLower: row.nameLower,
  applicableLevels: row.applicableLevels as AppLevelValue[],
  notes: row.notes,
  rest: false,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
