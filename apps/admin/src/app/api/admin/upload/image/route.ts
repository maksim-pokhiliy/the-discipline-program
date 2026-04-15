import {
  createDeleteWithBodyHandler,
  createFormDataPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { storageUploadAdminApi } from "@repo/api-server/storage";
import {
  deleteImageRequestSchema,
  uploadImageResponseSchema,
  type UploadContext,
  UPLOAD_CONFIG,
} from "@repo/contracts/storage/upload";
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

  return storageUploadAdminApi.uploadImage(file, context);
};

export const POST = withAdminAuth(
  withAuthRateLimit(
    createFormDataPostHandler(processUpload, uploadImageResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteWithBodyHandler(
      ({ url }) => storageUploadAdminApi.deleteImage(url),
      deleteImageRequestSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
