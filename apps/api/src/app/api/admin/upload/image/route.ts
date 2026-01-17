import { type NextRequest, NextResponse } from "next/server";

import { adminUploadApi } from "@repo/api-server";
import { type UploadContext } from "@repo/contracts/upload";
import { BadRequestError, handleApiError } from "@repo/errors";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const context = formData.get("context") as UploadContext | null;

    if (!file) {
      throw new BadRequestError("No file provided");
    }

    if (!context) {
      throw new BadRequestError("No context provided");
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
    const { url } = body;

    if (!url) {
      throw new BadRequestError("No URL provided");
    }

    await adminUploadApi.deleteImage(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
