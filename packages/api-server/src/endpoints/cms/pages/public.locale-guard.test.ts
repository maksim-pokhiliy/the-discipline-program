import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../../db/client";
import {
  seedLocaleCatalog,
  UKRAINIAN,
  UNKNOWN_LOCALE_CODE,
} from "../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { PAGE_READERS } from "./__fixtures__/page-readers";

const NO_PAGE_QUERIES = { sections: 0, products: 0, reviews: 0, blogPosts: 0 };

const spyOnPageQueries = () => ({
  sections: vi.spyOn(prisma.marketingPageSection, "findMany"),
  products: vi.spyOn(prisma.product, "findMany"),
  reviews: vi.spyOn(prisma.marketingReview, "findMany"),
  blogPosts: vi.spyOn(prisma.marketingBlogPost, "findMany"),
});

const countCalls = (queries: ReturnType<typeof spyOnPageQueries>): Record<string, number> =>
  Object.fromEntries(
    Object.entries(queries).map(([name, query]) => [name, query.mock.calls.length]),
  );

describe("cmsPagesPublicApi — locale guard", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it.each(PAGE_READERS)(
    "%s refuses an unknown locale before any page query",
    async (_slug, readPage) => {
      const pageQueries = spyOnPageQueries();

      await expect(readPage(UNKNOWN_LOCALE_CODE)).rejects.toThrow(NotFoundError);

      expect(countCalls(pageQueries)).toEqual(NO_PAGE_QUERIES);
    },
  );

  it.each(PAGE_READERS)(
    "%s looks the locale up once for a uk read and never for the default locale",
    async (_slug, readPage) => {
      const localeLookups = vi.spyOn(prisma.marketingLocale, "findUnique");

      await readPage(DEFAULT_LOCALE_CODE);

      expect(localeLookups).not.toHaveBeenCalled();

      await readPage(UKRAINIAN.code);

      expect(localeLookups).toHaveBeenCalledTimes(1);
    },
  );
});
