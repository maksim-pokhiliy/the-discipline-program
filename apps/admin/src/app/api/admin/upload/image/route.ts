import { NextResponse } from "next/server";

import { createDeleteWithBodyHandler } from "@repo/api-routes";
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

export const POST = withAdminAuth(async (request) => {
  const formData = await request.formData();
  const file = formData.get("file");
  const context = formData.get("context");

  if (!(file instanceof File)) {
    throw new BadRequestError("No valid file provided");
  }

  if (!isValidUploadContext(context)) {
    throw new BadRequestError("Invalid or missing context");
  }

  const result = await adminUploadApi.uploadImage(file, context);
  const validated = uploadImageResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withAdminAuth(
  createDeleteWithBodyHandler(
    ({ url }) => adminUploadApi.deleteImage(url),
    deleteImageRequestSchema,
  ),
);
