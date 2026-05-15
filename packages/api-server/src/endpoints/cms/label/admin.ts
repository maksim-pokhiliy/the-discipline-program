import { Prisma } from "@prisma/client";

import {
  type AdminLabelsPageData,
  type CreateLabelData,
  type Label,
  type UpdateLabelData,
} from "@repo/contracts/cms/label";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/cms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { DEFAULT_LIST_LIMIT } from "../../../utils/list-limits";

const buildLabelUpdateData = (data: UpdateLabelData): Prisma.LabelUpdateInput => ({
  ...(data.name !== undefined && {
    name: data.name,
    nameLower: data.name.trim().toLowerCase(),
  }),
  ...(data.applicableLevels !== undefined && { applicableLevels: data.applicableLevels }),
  ...(data.notes !== undefined && { notes: data.notes }),
});

export const cmsLabelAdminApi = {
  getLabels: async (): Promise<Label[]> => {
    const rows = await prisma.label.findMany({
      orderBy: { createdAt: "desc" },
      take: DEFAULT_LIST_LIMIT,
    });

    return rows.map(mapToLabel);
  },

  getLabelById: async (id: string): Promise<Label> => {
    const row = await findOrThrow(prisma.label.findUnique({ where: { id } }), "Label");

    return mapToLabel(row);
  },

  createLabel: async (data: CreateLabelData): Promise<Label> => {
    const nameLower = data.name.trim().toLowerCase();

    try {
      const row = await prisma.label.create({
        data: {
          name: data.name,
          nameLower,
          applicableLevels: data.applicableLevels,
          notes: data.notes ?? null,
        },
      });

      return mapToLabel(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Label with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Label" });
    }
  },

  updateLabel: async (id: string, data: UpdateLabelData): Promise<Label> => {
    await findOrThrow(prisma.label.findUnique({ where: { id } }), "Label");

    try {
      const row = await prisma.label.update({
        where: { id },
        data: buildLabelUpdateData(data),
      });

      return mapToLabel(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Label with this name already exists", {
          field: "name",
        });
      }

      return handlePrismaError(error, { entity: "Label" });
    }
  },

  deleteLabel: async (id: string): Promise<void> => {
    await findOrThrow(prisma.label.findUnique({ where: { id } }), "Label");

    try {
      await prisma.label.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError("Cannot delete: label is in use", {
          entity: "Label",
          relation: "days/sessions/blockAssignments",
        });
      }

      return handlePrismaError(error, { entity: "Label" });
    }
  },

  getLabelsPageData: async (): Promise<AdminLabelsPageData> => {
    const labels = await cmsLabelAdminApi.getLabels();

    return { labels };
  },
};
