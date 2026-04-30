import { type Prisma } from "@prisma/client";

export const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;
