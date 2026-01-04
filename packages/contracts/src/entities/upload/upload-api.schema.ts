import { z } from "zod";

export const uploadAvatarRequestSchema = z
  .object({
    file: z.instanceof(File),
  })
  .strict();

export const uploadAvatarResponseSchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

export const deleteAvatarRequestSchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

export const deleteAvatarResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .strict();
