import { type WeekTemplate as PrismaWeekTemplate } from "@prisma/client";

import { weekTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type WeekTemplate } from "@repo/contracts/lms/week-template";
import { InternalServerError } from "@repo/errors";

import { LIBRARY_SCOPE_MAP } from "./enum-maps";

export const mapToWeekTemplate = (s: PrismaWeekTemplate): WeekTemplate => {
  const parsed = weekTemplatePayloadSchema.safeParse(s.payload);

  if (!parsed.success) {
    throw new InternalServerError("WeekTemplate payload parse failure", {
      id: s.id,
      error: parsed.error.message,
    });
  }

  return {
    id: s.id,
    scope: LIBRARY_SCOPE_MAP[s.scope],
    ownerId: s.ownerId,
    name: s.name,
    description: s.description,
    payload: parsed.data,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    deletedAt: s.deletedAt,
  };
};
