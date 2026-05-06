import { z } from "zod";

export const refineNoNulByte = <S extends z.ZodString>(schema: S) =>
  schema.refine((s) => !s.includes("\0"), { message: "must not contain NUL byte" });

export const noNulByteString = (max?: number) => {
  const base = max === undefined ? z.string() : z.string().max(max);

  return refineNoNulByte(base);
};
