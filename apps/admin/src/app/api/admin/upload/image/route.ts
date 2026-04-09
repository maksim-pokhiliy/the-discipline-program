import { createDeleteWithBodyHandler, createFormDataPostHandler } from "@repo/api-routes";
import { adminUploadApi } from "@repo/api-server";
import {
  deleteImageRequestSchema,
  uploadImageResponseSchema,
  type UploadContext,
  UPLOAD_CONFIG,
} from "@repo/contracts/upload";
import { BadRequestError } from "@repo/errors";

import { withAdminAuth } from "@app/lib/server/auth";

const isValidUploadContext = (value: unknown): value is UploadContext => {
  return typeof value === "string" && value in UPLOAD_CONFIG;
};

const processUpload = async (formData: FormData) => {
  const file = formData.get("file");
  const context = formData.get("context");

  if (!(file instanceof File)) {
    throw new BadRequestError("No valid file provided");
  }

  if (!isValidUploadContext(context)) {
    throw new BadRequestError("Invalid or missing context");
  }

  return adminUploadApi.uploadImage(file, context);
};

export const POST = withAdminAuth(
  createFormDataPostHandler(processUpload, uploadImageResponseSchema),
);

export const DELETE = withAdminAuth(
  createDeleteWithBodyHandler(
    ({ url }) => adminUploadApi.deleteImage(url),
    deleteImageRequestSchema,
  ),
);
