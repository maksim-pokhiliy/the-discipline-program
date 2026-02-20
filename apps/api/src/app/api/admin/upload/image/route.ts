import { type NextRequest, NextResponse } from "next/server";

import { adminUploadApi } from "@repo/api-server";
import {
  deleteAvatarRequestSchema,
  type UploadContext,
  UPLOAD_CONFIG,
} from "@repo/contracts/upload";
import { BadRequestError } from "@repo/errors";

import { handleApiError } from "@app/lib/error-handler";

const isValidUploadContext = (value: unknown): value is UploadContext => {
  return typeof value === "string" && value in UPLOAD_CONFIG;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const context = formData.get("context");

    if (!(file instanceof File)) {
      throw new BadRequestError("No valid file provided");
    }

    if (!isValidUploadContext(context)) {
      throw new BadRequestError("Invalid or missing context");
    }

    const result = await adminUploadApi.uploadImage(file, context);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = deleteAvatarRequestSchema.parse(body);

    await adminUploadApi.deleteImage(validated.url);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
