import { createFormDataPostHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { storageUploadAdminApi } from "@repo/api-server/storage";
import { uploadImageResponseSchema } from "@repo/contracts/storage/upload";
import { BadRequestError } from "@repo/errors";

import { withAuthenticated } from "@app/lib/server/auth";

const processUpload = async (formData: FormData) => {
  const file = formData.get("file");
  const context = formData.get("context");

  if (!(file instanceof File)) {
    throw new BadRequestError("No valid file provided");
  }

  if (context !== "avatar") {
    throw new BadRequestError("Only avatar uploads are allowed");
  }

  return storageUploadAdminApi.uploadImage(file, "avatar");
};

export const POST = withAuthenticated(
  withAuthRateLimit(
    createFormDataPostHandler(processUpload, uploadImageResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
