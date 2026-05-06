import {
  type AdminDayTypesPageData,
  type CreateDayTypeData,
  type DayType,
  type UpdateDayTypeData,
} from "@repo/contracts/lms/day-type";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../../db/client";
import { mapToDayType } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../../utils";

const ensureUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.dayType.findFirst({
    where: {
      name,
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new ConflictError("DayType with this name already exists", { field: "name" });
  }
};

export const lmsDayTypeAdminApi = {
  getDayTypes: async (): Promise<DayType[]> => {
    const dayTypes = await prisma.dayType.findMany({
      orderBy: { createdAt: "desc" },
    });

    return dayTypes.map(mapToDayType);
  },

  getDayTypeById: async (id: string): Promise<DayType> => {
    const dayType = await findOrThrow(prisma.dayType.findUnique({ where: { id } }), "DayType");

    return mapToDayType(dayType);
  },

  createDayType: async (data: CreateDayTypeData): Promise<DayType> => {
    await ensureUniqueName(data.name);

    try {
      const dayType = await prisma.dayType.create({
        data: {
          name: data.name,
          color: data.color,
        },
      });

      return mapToDayType(dayType);
    } catch (error) {
      return handlePrismaError(error, { entity: "DayType", field: "name" });
    }
  },

  updateDayType: async (id: string, data: UpdateDayTypeData): Promise<DayType> => {
    await findOrThrow(prisma.dayType.findUnique({ where: { id } }), "DayType");

    if (data.name !== undefined) {
      await ensureUniqueName(data.name, id);
    }

    try {
      const dayType = await prisma.dayType.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
        },
      });

      return mapToDayType(dayType);
    } catch (error) {
      return handlePrismaError(error, { entity: "DayType", field: "name" });
    }
  },

  deleteDayType: async (id: string): Promise<void> => {
    try {
      await prisma.dayType.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "DayType" });
    }
  },

  getDayTypesPageData: async (): Promise<AdminDayTypesPageData> => {
    const dayTypes = await lmsDayTypeAdminApi.getDayTypes();

    return { dayTypes };
  },
};
