import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanup, cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "../pages/__fixtures__/section-data";
import { ABOUT_HERO_ROW, readRows } from "../pages/__fixtures__/section-rows";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";
import { seedTranslationProduct, translationBody } from "../product/__fixtures__/translations";

import { readLocale, seedLocaleCatalog, UKRAINIAN } from "./__fixtures__/locale-catalog";
import { openTransaction, refusalOf, waitForLockWaiter } from "./__fixtures__/lock-race";
import { cmsLocaleAdminApi } from "./admin";

const RACING_TRANSLATION = { title: "Переклад, збережений під час видалення" };
const DELETE_RACE_REFUSAL = {
  name: ConflictError.name,
  statusCode: 409,
  message: `Locale ${UKRAINIAN.code} received new content while it was being deleted; try again`,
  details: { code: UKRAINIAN.code },
};

describe("cmsLocaleAdminApi — deleteLocale races", () => {
  let snapshot: MarketingPagesState;
  const rows: { table: string; id: string }[] = [];

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedSectionsWithOverrides(FULL_SECTION_DATA);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup(...rows.splice(0));
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("refuses with a ConflictError asking to retry when a section row of the locale commits during the delete", async () => {
    const writer = await openTransaction((tx) =>
      tx.marketingPageSection.create({
        data: { ...ABOUT_HERO_ROW, locale: UKRAINIAN.code, data: RACING_TRANSLATION },
      }),
    );
    const refusal = refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code));

    try {
      await waitForLockWaiter("marketing_locales");
    } finally {
      await writer.commit();
    }

    expect(await refusal).toEqual(DELETE_RACE_REFUSAL);
    expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
    expect(await readRows(UKRAINIAN.code)).toEqual([
      expect.objectContaining({ data: RACING_TRANSLATION }),
    ]);
  });

  it("refuses with a ConflictError asking to retry and keeps every row of the locale when a translation lands after the count", async () => {
    await seedSectionsWithOverrides(
      { [ABOUT_HERO_ROW.section]: RACING_TRANSLATION },
      UKRAINIAN.code,
    );

    const ukRows = await readRows(UKRAINIAN.code);

    expect(ukRows.map(({ data }) => data)).toEqual(
      expect.arrayContaining([RACING_TRANSLATION, {}]),
    );

    vi.spyOn(prisma.marketingPageSection, "count").mockResolvedValueOnce(0);

    expect(await refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code))).toEqual(
      DELETE_RACE_REFUSAL,
    );
    expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
    expect(await readRows(UKRAINIAN.code)).toEqual(ukRows);
  });

  it("a product translation saved during the delete gets the retry refusal", async () => {
    const product = await seedTranslationProduct();

    rows.push({ table: "product", id: product.id });
    await cleanupRaw.marketingPageSection.create({
      data: { ...ABOUT_HERO_ROW, locale: UKRAINIAN.code, data: {} },
    });

    const ukRows = await readRows(UKRAINIAN.code);
    const { features: featureList, ...words } = translationBody(product.id);
    const writer = await openTransaction((tx) =>
      tx.productTranslation.create({ data: { ...words, featureList, isActive: true } }),
    );
    const refusal = refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code));

    try {
      await waitForLockWaiter("marketing_locales");
    } finally {
      await writer.commit();
      await refusal;
    }

    expect(await refusal).toEqual(DELETE_RACE_REFUSAL);
    expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
    expect(await readRows(UKRAINIAN.code)).toEqual(ukRows);
    expect(
      await cleanupRaw.productTranslation.findUnique({
        where: { productId_locale: { productId: product.id, locale: UKRAINIAN.code } },
      }),
    ).toMatchObject({ ...words, featureList, isActive: true });
  });
});
