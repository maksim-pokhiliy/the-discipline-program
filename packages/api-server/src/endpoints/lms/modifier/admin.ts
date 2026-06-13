import { Prisma } from "@prisma/client";

import {
  type AdminModifiersPageData,
  type CreateModifierData,
  type Modifier,
  type UpdateModifierData,
} from "@repo/contracts/lms/modifier";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToModifier } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError, marshalNullableJson } from "../../../utils";

const buildModifierUpdateData = (data: UpdateModifierData): Prisma.ModifierUpdateInput => ({
  ...(data.name !== undefined && {
    name: data.name,
    nameLower: data.name.trim().toLowerCase(),
  }),
  ...(data.notes !== undefined && { notes: marshalNullableJson(data.notes) }),
});

export const cmsModifierAdminApi = {
  getModifiers: async (): Promise<Modifier[]> => {
    const rows = await prisma.modifier.findMany({
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapToModifier);
  },

  getModifierById: async (id: string): Promise<Modifier> => {
    const row = await findOrThrow(prisma.modifier.findUnique({ where: { id } }), "Modifier");

    return mapToModifier(row);
  },

  createModifier: async (data: CreateModifierData): Promise<Modifier> => {
    const nameLower = data.name.trim().toLowerCase();

    try {
      const row = await prisma.modifier.create({
        data: {
          name: data.name,
          nameLower,
          notes: marshalNullableJson(data.notes),
        },
      });

      return mapToModifier(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Modifier with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Modifier" });
    }
  },

  updateModifier: async (id: string, data: UpdateModifierData): Promise<Modifier> => {
    await findOrThrow(prisma.modifier.findUnique({ where: { id } }), "Modifier");

    try {
      const row = await prisma.modifier.update({
        where: { id },
        data: buildModifierUpdateData(data),
      });

      return mapToModifier(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Modifier with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Modifier" });
    }
  },

  deleteModifier: async (id: string): Promise<void> => {
    await findOrThrow(prisma.modifier.findUnique({ where: { id } }), "Modifier");

    try {
      await prisma.modifier.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError("Cannot delete: modifier is in use", {
          entity: "Modifier",
          relation: "assignments",
        });
      }

      return handlePrismaError(error, { entity: "Modifier" });
    }
  },

  getModifiersPageData: async (): Promise<AdminModifiersPageData> => {
    const modifiers = await cmsModifierAdminApi.getModifiers();

    return { modifiers };
  },
};
