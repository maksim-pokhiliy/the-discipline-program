import { type Prisma } from "@prisma/client";

import {
  type CreateSchemeData,
  type Scheme,
  type SchemeParamKey,
  type UpdateSchemeData,
} from "@repo/contracts/library/scheme";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToScheme, SCHEME_KIND_TO_PRISMA_MAP } from "../../../mappers/library";
import { findOrThrow, handlePrismaError } from "../../../utils";

const toCreateInput = (data: CreateSchemeData): Prisma.SchemeUncheckedCreateInput => ({
  slug: data.slug,
  name: data.name,
  kind: SCHEME_KIND_TO_PRISMA_MAP[data.kind],
  description: data.description ?? null,
  requiredParams: data.requiredParams,
  paramDefaults: toParamDefaultsJson(data.paramDefaults),
  active: data.active,
  sortOrder: data.sortOrder,
});

const toParamDefaultsJson = (
  params: Partial<Record<SchemeParamKey, number>>,
): Prisma.InputJsonValue => {
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = value;
    }
  }

  return result;
};

const toUpdateData = (data: UpdateSchemeData): Prisma.SchemeUncheckedUpdateInput => {
  const update: Prisma.SchemeUncheckedUpdateInput = {};

  if (data.slug !== undefined) {
    update.slug = data.slug;
  }

  if (data.name !== undefined) {
    update.name = data.name;
  }

  if (data.description !== undefined) {
    update.description = data.description ?? null;
  }

  if (data.requiredParams !== undefined) {
    update.requiredParams = data.requiredParams;
  }

  if (data.paramDefaults !== undefined) {
    update.paramDefaults = toParamDefaultsJson(data.paramDefaults);
  }

  if (data.active !== undefined) {
    update.active = data.active;
  }

  if (data.sortOrder !== undefined) {
    update.sortOrder = data.sortOrder;
  }

  return update;
};

export const librarySchemeAdminApi = {
  list: async (params?: { includeInactive?: boolean }): Promise<Scheme[]> => {
    const includeInactive = params?.includeInactive ?? false;

    const rows = await prisma.scheme.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return rows.map(mapToScheme);
  },

  getById: async (id: string): Promise<Scheme> => {
    const row = await findOrThrow(prisma.scheme.findUnique({ where: { id } }), "Scheme");

    return mapToScheme(row);
  },

  create: async (input: CreateSchemeData): Promise<Scheme> => {
    try {
      const row = await prisma.scheme.create({ data: toCreateInput(input) });

      return mapToScheme(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme", field: "slug" });
    }
  },

  update: async (params: { id: string; input: UpdateSchemeData }): Promise<Scheme> => {
    const { id, input } = params;

    const existing = await findOrThrow(prisma.scheme.findUnique({ where: { id } }), "Scheme");

    if (input.kind !== undefined && SCHEME_KIND_TO_PRISMA_MAP[input.kind] !== existing.kind) {
      throw new ConflictError("Cannot change scheme kind on existing scheme", {
        id,
        currentKind: existing.kind,
      });
    }

    try {
      const row = await prisma.scheme.update({
        where: { id },
        data: toUpdateData(input),
      });

      return mapToScheme(row);
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme", field: "slug" });
    }
  },

  delete: async (id: string): Promise<void> => {
    await findOrThrow(prisma.scheme.findUnique({ where: { id } }), "Scheme");

    const usage = await prisma.workoutBlock.count({ where: { schemeId: id } });

    if (usage > 0) {
      throw new ConflictError("Scheme is referenced by existing workout blocks", {
        id,
        referenceCount: usage,
      });
    }

    try {
      await prisma.scheme.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Scheme" });
    }
  },
};
