import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type CreateLocaleData } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import {
  CATALOG_CODES,
  expectCatalogOrder,
  NEW_POLISH,
  NEW_SPANISH,
  NON_DEFAULT_CODES,
} from "./__fixtures__/catalog-order";
import { seedLocaleCatalog } from "./__fixtures__/locale-catalog";
import {
  openTransaction,
  refusalOf,
  waitForLockWaiter,
  type OpenTransaction,
} from "./__fixtures__/lock-race";
import { cmsLocaleAdminApi } from "./admin";
import { lockLocaleOrder } from "./locale-order-lock";

const parkLocaleCreation = (data: CreateLocaleData): Promise<OpenTransaction> =>
  openTransaction(async (tx) => {
    await lockLocaleOrder(tx);

    const sortOrder = await tx.marketingLocale.count();

    await tx.marketingLocale.create({ data: { ...data, isEnabled: false, sortOrder } });
  });

describe("cmsLocaleAdminApi — order races", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("two concurrent creates take two consecutive slots", async () => {
    const slot = await cleanupRaw.marketingLocale.count();
    const writer = await parkLocaleCreation(NEW_POLISH);
    const creation = Promise.allSettled([cmsLocaleAdminApi.createLocale(NEW_SPANISH)]);

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await creation;
    }

    expect(await creation).toEqual([
      expect.objectContaining({
        status: "fulfilled",
        value: expect.objectContaining({ ...NEW_SPANISH, sortOrder: slot + 1 }),
      }),
    ]);
    await expectCatalogOrder([...CATALOG_CODES, NEW_POLISH.code, NEW_SPANISH.code]);
  });

  it("a reorder parked behind a create refuses the now-stale set", async () => {
    const writer = await parkLocaleCreation(NEW_POLISH);
    const refusal = refusalOf(
      cmsLocaleAdminApi.reorderLocales({ orderedCodes: [...NON_DEFAULT_CODES].reverse() }),
    );

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await refusal;
    }

    expect(await refusal).toMatchObject({ name: ConflictError.name, statusCode: 409 });
    await expectCatalogOrder([...CATALOG_CODES, NEW_POLISH.code]);
  });
});
