import { type Prisma } from "@prisma/client";

import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export async function seedSectionsWithOverrides(
  overrides: Partial<Record<SectionSchemaKey, Prisma.InputJsonValue>>,
): Promise<void> {
  const slugs = Object.values(PageSlug);

  await cleanupRaw.marketingPage.createMany({
    data: slugs.map((slug) => ({ slug, title: slug })),
  });

  await cleanupRaw.marketingPageSection.createMany({
    data: slugs.flatMap((slug) =>
      Object.values(PAGE_SECTIONS_MAP[slug]).map((section) => ({
        pageSlug: slug,
        section,
        data: overrides[section] ?? {},
        isActive: true,
      })),
    ),
  });
}
