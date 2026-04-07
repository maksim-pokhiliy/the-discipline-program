import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { pagesApi } from "@repo/api-server";
import { getPageBySlugParamsSchema } from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

export const GET = withPublicRoute(async (_, context) => {
  const { pageSlug } = getPageBySlugParamsSchema.parse(await context.params);

  let pageData;

  switch (pageSlug) {
    case "home": {
      pageData = await pagesApi.getHomePage();
      break;
    }

    case "storefront": {
      pageData = await pagesApi.getStorefrontProgramsPage();
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

    case "faq": {
      pageData = await pagesApi.getFaqPage();
      break;
    }

    default: {
      throw new NotFoundError("Page not found", { pageSlug });
    }
  }

  return NextResponse.json(pageData);
});
