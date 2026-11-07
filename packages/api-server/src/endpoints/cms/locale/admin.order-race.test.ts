import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { type CreateLocaleData } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

import { prisma } from "../../../db/client";
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
import { GERMAN, seedLocaleCatalog } from "./__fixtures__/locale-catalog";
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("a delete parked behind a create keeps the catalog dense", async () => {
    const writer = await parkLocaleCreation(NEW_POLISH);
    const deletion = Promise.allSettled([cmsLocaleAdminApi.deleteLocale(GERMAN.code)]);

    try {
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      await writer.commit();
      await deletion;
    }

    expect(await deletion).toEqual([{ status: "fulfilled", value: undefined }]);
    await expectCatalogOrder([
      ...CATALOG_CODES.filter((code) => code !== GERMAN.code),
      NEW_POLISH.code,
    ]);
  });

  it("a production create parked before commit makes a second production create wait", async () => {
    let release = (): void => undefined;
    let markWorked = (): void => undefined;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const worked = new Promise<void>((resolve) => {
      markWorked = resolve;
    });
    const transaction = prisma.$transaction.bind(prisma);

    vi.spyOn(prisma, "$transaction").mockImplementationOnce((work, options) =>
      transaction(async (tx) => {
        const result = await work(tx);

        markWorked();
        await released;

        return result;
      }, options),
    );

    const slot = await cleanupRaw.marketingLocale.count();
    const first = cmsLocaleAdminApi.createLocale(NEW_POLISH);
    const firstOutcome = Promise.allSettled([first]);
    let secondOutcome: Promise<PromiseSettledResult<Awaited<typeof first>>[]> | undefined;

    try {
      await Promise.race([worked, first]);
      secondOutcome = Promise.allSettled([cmsLocaleAdminApi.createLocale(NEW_SPANISH)]);
      await waitForLockWaiter("pg_advisory_xact_lock");
    } finally {
      release();
      await firstOutcome;
      await secondOutcome;
    }

    expect(await firstOutcome).toEqual([
      expect.objectContaining({
        status: "fulfilled",
        value: expect.objectContaining({ ...NEW_POLISH, sortOrder: slot }),
      }),
    ]);
    expect(await secondOutcome).toEqual([
      expect.objectContaining({
        status: "fulfilled",
        value: expect.objectContaining({ ...NEW_SPANISH, sortOrder: slot + 1 }),
      }),
    ]);
    await expectCatalogOrder([...CATALOG_CODES, NEW_POLISH.code, NEW_SPANISH.code]);
  });
});
