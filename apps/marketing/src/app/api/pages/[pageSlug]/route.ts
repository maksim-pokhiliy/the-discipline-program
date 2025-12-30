import { pagesApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ pageSlug: string }> }) {
  try {
    const { pageSlug } = await params;

    let pageData;

    switch (pageSlug) {
      case "home": {
        pageData = await pagesApi.getHomePage();
        break;
      }

      case "programs": {
        pageData = await pagesApi.getProgramsPage();
        break;
      }

      case "about": {
        pageData = await pagesApi.getAboutPage();
        break;
      }

      case "blog": {
        pageData = await pagesApi.getBlogPage();
        break;
      }

      case "contact": {
        pageData = await pagesApi.getContactPage();
        break;
      }

      default: {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
    }

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
