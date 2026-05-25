import { Prisma } from "@prisma/client";

import {
  type AdminLabelsPageData,
  type CreateLabelData,
  type Label,
  labelSchema,
  REST_MUTEX_MESSAGE,
  type UpdateLabelData,
} from "@repo/contracts/lms/label";
import { BadRequestError, ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { DEFAULT_LIST_LIMIT } from "../../../utils/list-limits";

const buildLabelUpdateData = (data: UpdateLabelData): Prisma.LabelUpdateInput => ({
  ...(data.name !== undefined && {
    name: data.name,
    nameLower: data.name.trim().toLowerCase(),
  }),
  ...(data.applicableLevels !== undefined && { applicableLevels: data.applicableLevels }),
  ...(data.notes !== undefined && { notes: data.notes }),
  ...(data.rest !== undefined && { rest: data.rest }),
});

const mergeLabelPatch = (existing: Label, data: UpdateLabelData): Label => ({
  ...existing,
  ...(data.name !== undefined && {
    name: data.name,
    nameLower: data.name.trim().toLowerCase(),
  }),
  ...(data.applicableLevels !== undefined && { applicableLevels: data.applicableLevels }),
  ...(data.notes !== undefined && { notes: data.notes }),
  ...(data.rest !== undefined && { rest: data.rest }),
});

const assertMergedLabelInvariants = (merged: Label): void => {
  const result = labelSchema.safeParse(merged);

  if (result.success) {
    return;
  }

  const firstIssue = result.error.issues[0];
  const message = firstIssue?.message ?? REST_MUTEX_MESSAGE;
  const fieldPath = firstIssue?.path[0];
  const field = typeof fieldPath === "string" ? fieldPath : "rest";

  throw new BadRequestError(message, { field });
};

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
          rest: data.rest ?? false,
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
    const existing = await findOrThrow(prisma.label.findUnique({ where: { id } }), "Label");
    const merged = mergeLabelPatch(mapToLabel(existing), data);

    assertMergedLabelInvariants(merged);

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
