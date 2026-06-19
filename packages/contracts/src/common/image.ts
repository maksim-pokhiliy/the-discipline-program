import { z } from "zod";

import { BLOB_STORAGE_DOMAIN } from "../entities/storage/upload/upload.constants";

const MAX_IMAGE_URL_LENGTH = 2048;

const isBlobStorageUrl = (value: string): boolean => {
  try {
    return new URL(value).hostname.endsWith(BLOB_STORAGE_DOMAIN);
  } catch {
    return false;
  }
};

export const imageUrlSchema = z.string().url().nullable();

export const blobImageUrlSchema = z
  .string()
  .url()
  .max(MAX_IMAGE_URL_LENGTH)
  .refine(isBlobStorageUrl, "Image must be an uploaded blob URL")
  .nullable();
