import { Prisma } from "@prisma/client";

import {
  type AdminSchemeTypesPageData,
  type CreateSchemeTypeData,
  type SchemeType,
  type UpdateSchemeTypeData,
} from "@repo/contracts/lms/scheme-type";
import { ConflictError, ValidationError } from "@repo/errors";

import { prisma } from "../../../../db/client";
import { mapToSchemeType, SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP } from "../../../../mappers/lms";
import { findOrThrow, handlePrismaError, toInputJson } from "../../../../utils";

const ensureUniqueName = async (name: string, excludeId?: string): Promise<void> => {
  const existing = await prisma.schemeType.findFirst({
    where: {
      name,
      ...(excludeId !== undefined && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new ConflictError("SchemeType with this name already exists", { field: "name" });
  }
};

export const lmsSchemeTypeAdminApi = {
  getSchemeTypes: async (): Promise<SchemeType[]> => {
    const schemeTypes = await prisma.schemeType.findMany({
      orderBy: { createdAt: "desc" },
    });

    return schemeTypes.map(mapToSchemeType);
  },

  getSchemeTypeById: async (id: string): Promise<SchemeType> => {
    const schemeType = await findOrThrow(
      prisma.schemeType.findUnique({ where: { id } }),
      "SchemeType",
    );

    return mapToSchemeType(schemeType);
  },

  createSchemeType: async (data: CreateSchemeTypeData): Promise<SchemeType> => {
    if (data.defaultParams !== undefined && data.defaultParams.kind !== data.archetypeKind) {
      throw new ValidationError("defaultParams.kind must match archetypeKind", {
        field: "defaultParams",
      });
    }

    await ensureUniqueName(data.name);

    try {
      const schemeType = await prisma.schemeType.create({
        data: {
          name: data.name,
          archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind],
          defaultParams:
            data.defaultParams === undefined ? Prisma.DbNull : toInputJson(data.defaultParams),
        },
      });

      return mapToSchemeType(schemeType);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemeType", field: "name" });
    }
  },

  updateSchemeType: async (id: string, data: UpdateSchemeTypeData): Promise<SchemeType> => {
    const existing = mapToSchemeType(
      await findOrThrow(prisma.schemeType.findUnique({ where: { id } }), "SchemeType"),
    );

    if (data.name !== undefined) {
      await ensureUniqueName(data.name, id);
    }

    const effectiveArchetypeKind = data.archetypeKind ?? existing.archetypeKind;
    const effectiveDefaultParams =
      data.defaultParams !== undefined ? data.defaultParams : existing.defaultParams;

    if (effectiveDefaultParams !== null && effectiveDefaultParams.kind !== effectiveArchetypeKind) {
      throw new ValidationError("defaultParams.kind must match archetypeKind", {
        field: "defaultParams",
      });
    }

    try {
      const schemeType = await prisma.schemeType.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.archetypeKind !== undefined && {
            archetypeKind: SCHEME_ARCHETYPE_KIND_TO_PRISMA_MAP[data.archetypeKind],
          }),
          ...(data.defaultParams !== undefined && {
            defaultParams: toInputJson(data.defaultParams),
          }),
        },
      });

      return mapToSchemeType(schemeType);
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemeType", field: "name" });
    }
  },

  deleteSchemeType: async (id: string): Promise<void> => {
    try {
      await prisma.schemeType.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "SchemeType" });
    }
  },

  getSchemeTypesPageData: async (): Promise<AdminSchemeTypesPageData> => {
    const schemeTypes = await lmsSchemeTypeAdminApi.getSchemeTypes();

    return { schemeTypes };
  },
};
