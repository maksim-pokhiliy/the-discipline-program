import { NextResponse } from "next/server";

import { pagesApi } from "@repo/api-server";
import { getPageBySlugParamsSchema } from "@repo/contracts/pages";
import { handleApiError, NotFoundError } from "@repo/errors";

export async function GET(_: Request, { params }: { params: Promise<{ pageSlug: string }> }) {
  try {
    const { pageSlug } = getPageBySlugParamsSchema.parse(await params);

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
        throw new NotFoundError("Page not found", { pageSlug });
      }
    }

    return NextResponse.json(pageData);
  } catch (error) {
    return handleApiError(error);
  }
}
