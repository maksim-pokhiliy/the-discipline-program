import { type DayType as PrismaDayType } from "@prisma/client";

import { type DayType } from "@repo/contracts/lms/day-type";

export const mapToDayType = (d: PrismaDayType): DayType => ({
  id: d.id,
  name: d.name,
  color: d.color,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
