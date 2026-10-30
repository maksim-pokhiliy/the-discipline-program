import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../../test/helpers";
import { seedLocaleCatalog } from "../../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./marketing-pages-state";
import { FULL_SECTION_DATA } from "./section-data";
import { seedSectionsWithOverrides } from "./seed-with-overrides";

export const setupLocalizedPageState = (resetEnglishSection: () => Promise<void>): void => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  beforeEach(async () => {
    await cleanupRaw.marketingPageSection.deleteMany({
      where: { locale: { not: DEFAULT_LOCALE_CODE } },
    });
    await resetEnglishSection();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });
};
