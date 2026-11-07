import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

const FIXTURE_DATE = new Date("2026-11-07T12:00:00.000Z");

export const makeLanguage = (
  overrides: Partial<AdminLocaleListItem> = {},
): AdminLocaleListItem => ({
  code: "uk",
  name: "Українська",
  isEnabled: false,
  isDefault: false,
  sortOrder: 1,
  translatedSectionCount: 0,
  createdAt: FIXTURE_DATE,
  updatedAt: FIXTURE_DATE,
  ...overrides,
});

export const ENGLISH = makeLanguage({
  code: "en",
  name: "English",
  isDefault: true,
  isEnabled: true,
  sortOrder: 0,
});
export const UKRAINIAN = makeLanguage();
export const POLISH = makeLanguage({ code: "pl", name: "Polski", sortOrder: 2 });

type PendingRequest = { promise: Promise<void>; resolve: () => void };

export const makePendingRequest = (): PendingRequest => {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });

  return { promise, resolve: () => resolve() };
};
