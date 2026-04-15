import { z } from "zod";

import { BLOB_STORAGE_DOMAIN } from "./upload.constants";

export const uploadImageRequestSchema = z.object({
  file: z.custom<File>(
    (v) => typeof globalThis.File !== "undefined" && v instanceof File,
    "Expected a File",
  ),
});

export const uploadImageResponseSchema = z.object({
  url: z.string().url(),
});

const isBlobStorageUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);

    return hostname.endsWith(BLOB_STORAGE_DOMAIN);
  } catch {
    return false;
  }
};

export const deleteImageRequestSchema = z.object({
  url: z.string().url().refine(isBlobStorageUrl, "URL must point to the blob storage domain"),
});

export const deleteImageResponseSchema = z.object({
  success: z.boolean(),
});
