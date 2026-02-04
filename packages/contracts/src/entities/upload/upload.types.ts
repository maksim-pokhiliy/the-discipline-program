import { type z } from "zod";

import {
  type deleteAvatarRequestSchema,
  type deleteAvatarResponseSchema,
  type uploadAvatarRequestSchema,
  type uploadAvatarResponseSchema,
} from "./upload-api.schema";

export type UploadImageRequest = z.infer<typeof uploadAvatarRequestSchema>;
export type UploadImageResponse = z.infer<typeof uploadAvatarResponseSchema>;
export type DeleteImageRequest = z.infer<typeof deleteAvatarRequestSchema>;
export type DeleteImageResponse = z.infer<typeof deleteAvatarResponseSchema>;
