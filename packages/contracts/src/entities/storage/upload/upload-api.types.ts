import { type z } from "zod";

import {
  type deleteImageRequestSchema,
  type deleteImageResponseSchema,
  type uploadImageRequestSchema,
  type uploadImageResponseSchema,
} from "./upload-api.schema";

export type UploadImageRequest = z.infer<typeof uploadImageRequestSchema>;
export type UploadImageResponse = z.infer<typeof uploadImageResponseSchema>;
export type DeleteImageRequest = z.infer<typeof deleteImageRequestSchema>;
export type DeleteImageResponse = z.infer<typeof deleteImageResponseSchema>;
