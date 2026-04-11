import { z } from "zod";

export const uploadImageRequestSchema = z.object({
  file: z.custom<File>(
    (v) => typeof globalThis.File !== "undefined" && v instanceof File,
    "Expected a File",
  ),
});

export const uploadImageResponseSchema = z.object({
  url: z.string().url(),
});

export const deleteImageRequestSchema = z.object({
  url: z.string().url(),
});

export const deleteImageResponseSchema = z.object({
  success: z.boolean(),
});
