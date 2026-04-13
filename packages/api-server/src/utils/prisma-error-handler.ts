import { Prisma } from "@prisma/client";

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

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

    if (error.code === "P2003") {
      const field = (error.meta?.field_name as string) || context.field;

      throw new BadRequestError(`Referenced ${context.entity} does not exist`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2011") {
      const constraint = error.meta?.constraint;
      const field = Array.isArray(constraint) ? constraint[0] : context.field;

      throw new BadRequestError(`Required field is missing for ${context.entity}`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2025") {
      throw new NotFoundError(`${context.entity} not found`);
    }

    if (error.code === "P2034") {
      throw new ConflictError(`${context.entity} was modified concurrently, please retry`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerError(`Database operation failed for ${context.entity}`);
  }

  throw error;
};
