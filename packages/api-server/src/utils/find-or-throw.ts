import { NotFoundError } from "@repo/errors";

export const findOrThrow = async <T>(query: Promise<T | null>, entityName: string): Promise<T> => {
  const result = await query;

  if (!result) {
    throw new NotFoundError(`${entityName} not found`);
  }

  return result;
};
