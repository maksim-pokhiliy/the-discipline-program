import { pagesApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ pageSlug: string }> }) {
  try {
    const { pageSlug } = await params;

    if (!pageSlug) {
      return Response.json({ error: "Page slug is required" }, { status: 400 });
    }

    const pageData = await pagesApi.getPage(pageSlug);

    return NextResponse.json(pageData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("page not found")) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    console.error("Failed to fetch page data:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
