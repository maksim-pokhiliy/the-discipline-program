import { programsApi, reviewsApi, pagesApi } from "@repo/api";

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const [domain, resource, ...rest] = path;

    switch (`${domain}/${resource}`) {
      case "marketing/programs": {
        const data = await programsApi.getPrograms();

        return Response.json(data);
      }

      case "marketing/reviews": {
        const data = await reviewsApi.getReviews();

        return Response.json(data);
      }

      case "marketing/pages": {
        const pageSlug = rest[0];

        if (!pageSlug) {
          return Response.json({ error: "Page slug is required" }, { status: 400 });
        }

        const data = await pagesApi.getPage(pageSlug);

        return Response.json(data);
      }

      case "marketing/blog-articles": {
        const slug = rest[0];

        if (!slug) {
          return Response.json({ error: "Article slug is required" }, { status: 400 });
        }

        const data = await pagesApi.getBlogArticle(slug);

        return Response.json(data);
      }

      default: {
        return Response.json({ error: "Endpoint not found" }, { status: 404 });
      }
    }
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
