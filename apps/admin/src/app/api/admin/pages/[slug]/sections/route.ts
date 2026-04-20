import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { pageSlugRouteParamsSchema, updatePageSectionBodySchema } from "@repo/contracts/cms/pages";
import { baseEnv } from "@repo/env/base";

import { withAdminAuth } from "@app/lib/server/auth";

const PAGE_PATH_MAP: Record<string, string> = {
  home: "/",
  storefront: "/storefront",
  about: "/about",
  blog: "/blog",
  contact: "/contact",
  faq: "/faq",
};

async function triggerMarketingRevalidation(slug: string): Promise<void> {
  const secret = baseEnv.REVALIDATE_SECRET;
  const path = PAGE_PATH_MAP[slug];

  if (!secret || !path) {return;}

  const url = `${baseEnv.NEXT_PUBLIC_MARKETING_URL}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;

  await fetch(url, { cache: "no-store" }).catch(() => {});
}

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      async ({ slug }, body) => {
        await cmsPagesAdminApi.updateSection({ ...body, pageSlug: slug });
        await triggerMarketingRevalidation(slug);
      },
      pageSlugRouteParamsSchema,
      updatePageSectionBodySchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
