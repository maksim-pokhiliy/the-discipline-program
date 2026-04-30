import { type SessionTemplate as PrismaSessionTemplate } from "@prisma/client";

import { sessionTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type SessionTemplate } from "@repo/contracts/lms/session-template";
import { InternalServerError } from "@repo/errors";

import { LIBRARY_SCOPE_MAP } from "./enum-maps";

export const mapToSessionTemplate = (s: PrismaSessionTemplate): SessionTemplate => {
  const parsed = sessionTemplatePayloadSchema.safeParse(s.payload);

  if (!parsed.success) {
    throw new InternalServerError("SessionTemplate payload parse failure", {
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
