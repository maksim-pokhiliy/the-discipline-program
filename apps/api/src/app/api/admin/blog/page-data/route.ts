import { adminBlogApi } from "@repo/api-server";
import { getBlogPageDataResponseSchema } from "@repo/contracts/blog";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminBlogApi.getBlogPageData, getBlogPageDataResponseSchema);
