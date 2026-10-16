import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  DEFAULT_LOCALE_ROW,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import { UKRAINIAN } from "./__fixtures__/locale-catalog";
import { cmsLocaleAdminApi } from "./admin";

const REPEATED_READS = 3;
const NEW_UKRAINIAN = { code: UKRAINIAN.code, name: UKRAINIAN.name };
const RENAMED_DEFAULT_LOCALE_NAME = "English (UK)";

const readLocaleRows = () =>
  cleanupRaw.marketingLocale.findMany({
    orderBy: { code: "asc" },
    select: { code: true, name: true, isEnabled: true, sortOrder: true },
  });

describe("cmsLocaleAdminApi — empty table", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await cleanupRaw.marketingLocale.deleteMany();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("getLocales recreates the default locale on a table without it", async () => {
    expect(await cleanupRaw.marketingLocale.count()).toBe(0);

    const locales = await cmsLocaleAdminApi.getLocales();

    expect(locales).toEqual([expect.objectContaining({ ...DEFAULT_LOCALE_ROW, isDefault: true })]);
    expect(await readLocaleRows()).toEqual([DEFAULT_LOCALE_ROW]);
  });

  it("getLocales recreates the default locale once however often it runs", async () => {
    for (let read = 0; read < REPEATED_READS; read += 1) {
      expect(await cmsLocaleAdminApi.getLocales()).toHaveLength(1);
    }

    expect(await readLocaleRows()).toEqual([DEFAULT_LOCALE_ROW]);
  });

  it("createLocale recreates the default locale first and orders the new disabled locale after it", async () => {
    const created = await cmsLocaleAdminApi.createLocale(NEW_UKRAINIAN);

    expect(created).toMatchObject({ ...NEW_UKRAINIAN, isEnabled: false, sortOrder: 1 });
    expect(await readLocaleRows()).toEqual([
      DEFAULT_LOCALE_ROW,
      { ...NEW_UKRAINIAN, isEnabled: false, sortOrder: 1 },
    ]);
  });

  it("updateLocale renames the default locale on a table without it", async () => {
    const renamed = await cmsLocaleAdminApi.updateLocale(DEFAULT_LOCALE_CODE, {
      name: RENAMED_DEFAULT_LOCALE_NAME,
    });

    expect(renamed).toMatchObject({ code: DEFAULT_LOCALE_CODE, name: RENAMED_DEFAULT_LOCALE_NAME });
    expect(await readLocaleRows()).toEqual([
      { ...DEFAULT_LOCALE_ROW, name: RENAMED_DEFAULT_LOCALE_NAME },
    ]);
  });
});
