import { LOCALE_CONSTANTS, type AdminLocaleListItem } from "@repo/contracts/cms/locale";

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

export const INVALID_LANGUAGE_NAMES = [
  { kind: "empty", name: "", message: "String must contain at least 1 character(s)" },
  { kind: "whitespace-only", name: "   ", message: "String must contain at least 1 character(s)" },
  {
    kind: "over-limit",
    name: "x".repeat(LOCALE_CONSTANTS.MAX_NAME_LENGTH + 1),
    message: `String must contain at most ${LOCALE_CONSTANTS.MAX_NAME_LENGTH} character(s)`,
  },
];

type Pending<TValue extends void | AdminLocaleListItem[]> = {
  promise: Promise<TValue>;
  resolve: (value: TValue) => void;
};

export const makePending = <TValue extends void | AdminLocaleListItem[]>(): Pending<TValue> => {
  let resolve: Pending<TValue>["resolve"] = () => {
    throw new Error("Pending promise was not initialized");
  };
  const promise = new Promise<TValue>((finish) => {
    resolve = finish;
  });

  return { promise, resolve };
};
