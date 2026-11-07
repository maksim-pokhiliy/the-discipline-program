import { expect } from "vitest";

import { DEFAULT_LOCALE_CODE } from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../../test/helpers";

import { SEEDED_LOCALES } from "./locale-catalog";

export const NON_DEFAULT_CODES = SEEDED_LOCALES.map(({ code }) => code);
export const CATALOG_CODES = [DEFAULT_LOCALE_CODE, ...NON_DEFAULT_CODES];
export const NEW_POLISH = { code: "pl", name: "Polski" };
export const NEW_SPANISH = { code: "es", name: "Español" };

export const readCatalogOrder = (): Promise<{ code: string; sortOrder: number }[]> =>
  cleanupRaw.marketingLocale.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: { code: true, sortOrder: true },
  });

export const expectCatalogOrder = async (codes: readonly string[]): Promise<void> => {
  expect(await readCatalogOrder()).toEqual(codes.map((code, sortOrder) => ({ code, sortOrder })));
};
