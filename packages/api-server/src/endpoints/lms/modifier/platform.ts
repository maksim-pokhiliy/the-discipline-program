import { Prisma } from "@prisma/client";

import {
  type CreateModifierData,
  type Modifier,
  type ModifierSearchParams,
} from "@repo/contracts/lms/modifier";
import { ConflictError } from "@repo/errors";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToModifier } from "../../../mappers/lms";
import { handlePrismaError, marshalNullableJson } from "../../../utils";

export const lmsModifierPlatformApi = {
  list: async (userId: string, query?: ModifierSearchParams): Promise<Modifier[]> => {
    await requireCoachLikeRole(userId);

    const { q } = query ?? {};

    const where = {
      ...(q !== undefined && { nameLower: { contains: q.toLowerCase() } }),
    };

    const rows = await prisma.modifier.findMany({
      ...(Object.keys(where).length > 0 && { where }),
      orderBy: { nameLower: "asc" },
    });

    return rows.map(mapToModifier);
  },

  create: async (userId: string, data: CreateModifierData): Promise<Modifier> => {
    await requireCoachLikeRole(userId);

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
};
