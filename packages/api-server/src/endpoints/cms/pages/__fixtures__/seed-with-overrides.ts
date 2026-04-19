import { type Prisma } from "@prisma/client";

import { PAGE_SECTIONS_MAP, PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export type SectionState = {
  id: string;
  pageSlug: string;
  section: string;
  wasCreated: boolean;
  previousData: Prisma.JsonValue;
};

export async function seedSectionsWithOverrides(
  overrides: Partial<Record<SectionSchemaKey, Prisma.InputJsonValue>>,
): Promise<{ states: SectionState[]; createdPageIds: string[] }> {
  const states: SectionState[] = [];
  const createdPageIds: string[] = [];

  for (const slug of Object.values(PageSlug)) {
    const existingPage = await cleanupRaw.marketingPage.findUnique({ where: { slug } });

    if (!existingPage) {
      const page = await cleanupRaw.marketingPage.create({ data: { slug, title: slug } });

      createdPageIds.push(page.id);
    }

    for (const section of Object.values(PAGE_SECTIONS_MAP[slug])) {
      const sectionKey = section as SectionSchemaKey;
      const data: Prisma.InputJsonValue = overrides[sectionKey] ?? {};
      const existing = await cleanupRaw.marketingPageSection.findFirst({
        where: { pageSlug: slug, section },
      });

      if (existing) {
        states.push({
          id: existing.id,
          pageSlug: slug,
          section,
          wasCreated: false,
          previousData: existing.data,
        });
        await cleanupRaw.marketingPageSection.update({
          where: { id: existing.id },
          data: { data },
        });
      } else {
        const created = await cleanupRaw.marketingPageSection.create({
          data: { pageSlug: slug, section, data, isActive: true },
        });

        states.push({
          id: created.id,
          pageSlug: slug,
          section,
          wasCreated: true,
          previousData: {},
        });
      }
    }
  }

  return { states, createdPageIds };
}

export async function restoreSections(
  states: SectionState[],
  createdPageIds: string[],
): Promise<void> {
  for (const { pageSlug, section, wasCreated, previousData, id } of states) {
    if (wasCreated) {
      await cleanupRaw.marketingPageSection.delete({ where: { id } }).catch(() => {});
    } else {
      await cleanupRaw.marketingPageSection.updateMany({
        where: { pageSlug, section },
        data: { data: JSON.parse(JSON.stringify(previousData)) as Prisma.InputJsonValue },
      });
    }
  }

  for (const id of createdPageIds.reverse()) {
    await cleanupRaw.marketingPage.delete({ where: { id } }).catch(() => {});
  }
}
