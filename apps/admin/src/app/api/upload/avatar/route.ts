import { adminUploadApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await adminUploadApi.uploadAvatar(file);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);

    const message = error instanceof Error ? error.message : "Upload failed";

    const status =
      message.includes("Invalid file type") || message.includes("too large") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json();

    await adminUploadApi.deleteAvatar(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);

    const message = error instanceof Error ? error.message : "Delete failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
