import { type BlockTemplate as PrismaBlockTemplate } from "@prisma/client";

import { blockTemplatePayloadSchema } from "@repo/contracts/lms/_domain";
import { type BlockTemplate } from "@repo/contracts/lms/block-template";
import { InternalServerError } from "@repo/errors";

import { LIBRARY_SCOPE_MAP } from "./enum-maps";

export const mapToBlockTemplate = (s: PrismaBlockTemplate): BlockTemplate => {
  const parsed = blockTemplatePayloadSchema.safeParse(s.payload);

  if (!parsed.success) {
    throw new InternalServerError("BlockTemplate payload parse failure", {
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
