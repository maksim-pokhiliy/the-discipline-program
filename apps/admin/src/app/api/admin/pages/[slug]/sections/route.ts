import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import {
  PAGE_SLUG_PATH_MAP,
  pageSlugRouteParamsSchema,
  updatePageSectionBodySchema,
} from "@repo/contracts/cms/pages";
import { baseEnv } from "@repo/env/base";
import { logger } from "@repo/shared";

import { withAdminAuth } from "@app/lib/server/auth";

async function triggerMarketingRevalidation(slug: string): Promise<void> {
  const secret = baseEnv.REVALIDATE_SECRET;
  const path = PAGE_SLUG_PATH_MAP[slug as keyof typeof PAGE_SLUG_PATH_MAP];

  if (!secret || !path) {
    return;
  }

  const url = `${baseEnv.NEXT_PUBLIC_MARKETING_URL}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;

  await fetch(url, { cache: "no-store" }).catch((err: unknown) => {
    logger.error("failed to revalidate marketing page", { slug, path, err });
  });
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
