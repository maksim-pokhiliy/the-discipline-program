import { NextResponse } from "next/server";

import { adminUploadApi } from "@repo/api-server";
import {
  deleteAvatarRequestSchema,
  uploadAvatarResponseSchema,
  deleteAvatarResponseSchema,
} from "@repo/contracts/upload";
import { handleApiError, BadRequestError } from "@repo/errors";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new BadRequestError("No file provided");
    }

    const result = await adminUploadApi.uploadAvatar(file);
    const validated = uploadAvatarResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { url } = deleteAvatarRequestSchema.parse(body);

    await adminUploadApi.deleteAvatar(url);

    const validated = deleteAvatarResponseSchema.parse({ success: true });

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
