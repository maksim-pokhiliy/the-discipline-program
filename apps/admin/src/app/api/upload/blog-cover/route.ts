import { adminUploadApi } from "@repo/api";
import { NextResponse } from "next/server";

const resolveErrorStatus = (message: string) =>
  message.includes("Invalid file type") || message.includes("too large") ? 400 : 500;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await adminUploadApi.uploadBlogCover(file);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Blog cover upload error:", error);

    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: resolveErrorStatus(message) });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json();

    await adminUploadApi.deleteBlogCover(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog cover delete error:", error);

    const message = error instanceof Error ? error.message : "Delete failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
