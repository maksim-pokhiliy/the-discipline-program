import { z } from "zod";

export const uploadAvatarRequestSchema = z.object({
  file: z.instanceof(File),
});

export const uploadAvatarResponseSchema = z.object({
  url: z.string().url(),
});

export const deleteAvatarRequestSchema = z.object({
  url: z.string().url(),
});

export const deleteAvatarResponseSchema = z.object({
  success: z.boolean(),
});
