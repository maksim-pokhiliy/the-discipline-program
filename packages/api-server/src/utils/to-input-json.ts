import { Prisma } from "@prisma/client";

export const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

export const marshalNullableJson = (
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return toInputJson(value);
};
