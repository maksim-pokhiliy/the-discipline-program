import { Prisma } from "@prisma/client";

import {
  type AdminEquipmentPageData,
  type CreateEquipmentData,
  type Equipment,
  type UpdateEquipmentData,
} from "@repo/contracts/lms/equipment";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToEquipment } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";

const buildEquipmentUpdateData = (data: UpdateEquipmentData): Prisma.EquipmentUpdateInput => ({
  ...(data.name !== undefined && {
    name: data.name,
    nameLower: data.name.trim().toLowerCase(),
  }),
  ...(data.notes !== undefined && { notes: data.notes }),
});

export const cmsEquipmentAdminApi = {
  getEquipment: async (): Promise<Equipment[]> => {
    const rows = await prisma.equipment.findMany({
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapToEquipment);
  },

  getEquipmentById: async (id: string): Promise<Equipment> => {
    const row = await findOrThrow(prisma.equipment.findUnique({ where: { id } }), "Equipment");

    return mapToEquipment(row);
  },

  createEquipment: async (data: CreateEquipmentData): Promise<Equipment> => {
    const nameLower = data.name.trim().toLowerCase();

    try {
      const row = await prisma.equipment.create({
        data: {
          name: data.name,
          nameLower,
          notes: data.notes ?? null,
        },
      });

      return mapToEquipment(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Equipment with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Equipment" });
    }
  },

  updateEquipment: async (id: string, data: UpdateEquipmentData): Promise<Equipment> => {
    await findOrThrow(prisma.equipment.findUnique({ where: { id } }), "Equipment");

    try {
      const row = await prisma.equipment.update({
        where: { id },
        data: buildEquipmentUpdateData(data),
      });

      return mapToEquipment(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Equipment with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Equipment" });
    }
  },

  deleteEquipment: async (id: string): Promise<void> => {
    await findOrThrow(prisma.equipment.findUnique({ where: { id } }), "Equipment");

    try {
      await prisma.equipment.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError("Cannot delete: equipment is in use", {
          entity: "Equipment",
          relation: "assignments",
        });
      }

      return handlePrismaError(error, { entity: "Equipment" });
    }
  },

  getEquipmentPageData: async (): Promise<AdminEquipmentPageData> => {
    const equipment = await cmsEquipmentAdminApi.getEquipment();

    return { equipment };
  },
};
