import { type Equipment as PrismaEquipment } from "@prisma/client";

import { type Equipment } from "@repo/contracts/lms/equipment";

export const mapToEquipment = (row: PrismaEquipment): Equipment => ({
  id: row.id,
  name: row.name,
  nameLower: row.nameLower,
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
