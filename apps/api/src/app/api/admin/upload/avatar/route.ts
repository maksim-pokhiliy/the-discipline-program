import { adminUploadApi } from "@repo/api/server";
import { handleApiError, BadRequestError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new BadRequestError("No file provided");
    }

    const result = await adminUploadApi.uploadAvatar(file);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();

    await adminUploadApi.deleteAvatar(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
