import { type Label as PrismaLabel } from "@prisma/client";

import { type AppLevelValue, type Label } from "@repo/contracts/cms/label";

export const mapToLabel = (row: PrismaLabel): Label => ({
  id: row.id,
  name: row.name,
  nameLower: row.nameLower,
  applicableLevels: row.applicableLevels as AppLevelValue[],
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
