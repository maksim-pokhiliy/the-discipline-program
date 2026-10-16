import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP } from "@repo/contracts/cms/pages";

import { defaultMonitoring } from "../../../infrastructure/monitoring";
import { UKRAINIAN } from "../locale/__fixtures__/locale-catalog";

import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { UNPARSABLE_SECTION_DATA } from "./__fixtures__/section-data";
import { seedSectionsWithOverrides } from "./__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "./public";

const ABOUT_HERO = PAGE_SECTIONS_MAP.about.hero;
const ABOUT_HERO_WARNING_TAGS = { area: "cms.pages.public", section: ABOUT_HERO };

describe("cmsPagesPublicApi — unparsable section warnings", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
    await clearMarketingPagesState();
    await seedSectionsWithOverrides({ [ABOUT_HERO]: UNPARSABLE_SECTION_DATA });
    await seedSectionsWithOverrides({ [ABOUT_HERO]: UNPARSABLE_SECTION_DATA }, UKRAINIAN.code);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("tags each warning with the locale of the row that failed to parse", async () => {
    const warnings = vi.spyOn(defaultMonitoring, "captureException");

    const page = await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code);

    expect(page.hero).toBeNull();
    expect(warnings.mock.calls.map(([, context]) => context?.tags)).toEqual([
      { ...ABOUT_HERO_WARNING_TAGS, locale: UKRAINIAN.code },
      { ...ABOUT_HERO_WARNING_TAGS, locale: DEFAULT_LOCALE_CODE },
    ]);
  });
});
