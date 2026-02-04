import { Prisma } from "@prisma/client";

import { ConflictError, NotFoundError } from "@repo/errors";

export const handlePrismaError = (
  error: unknown,
  context: { entity: string; field?: string },
): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target[0] : context.field;

      throw new ConflictError(`${context.entity} with this ${field || "value"} already exists`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2025") {
      throw new NotFoundError(`${context.entity} not found`);
    }
  }

  throw error;
};
