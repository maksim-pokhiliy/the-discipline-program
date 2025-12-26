import { pagesApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ articleSlug: string }> }) {
  try {
    const { articleSlug } = await params;

    if (!articleSlug) {
      return NextResponse.json({ error: "Article slug is required" }, { status: 400 });
    }

    const article = await pagesApi.getBlogArticle(articleSlug);

    return NextResponse.json(article);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Blog article not found" }, { status: 404 });
    }

    console.error("Failed to fetch article:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
