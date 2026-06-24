import { type ProfileAxis as PrismaProfileAxis } from "@prisma/client";

import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

export const mapToProfileAxis = (row: PrismaProfileAxis): ProfileAxis => ({
  id: row.id,
  key: row.key,
  label: row.label,
  values: row.values,
  binding: row.binding,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
