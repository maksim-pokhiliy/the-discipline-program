import {
  DEFAULT_LOCALE_CODE,
  DEFAULT_LOCALE_NAME,
  type AdminLocaleListItem,
} from "@repo/contracts/cms/locale";

import { type EditorLocale } from "./components/locale-gate";

const FIXTURE_DATE = new Date("2026-11-08T12:00:00.000Z");

export const ENGLISH_LOCALE: EditorLocale = {
  code: DEFAULT_LOCALE_CODE,
  name: DEFAULT_LOCALE_NAME,
  isDefault: true,
  isEnabled: true,
};
export const UKRAINIAN_LOCALE: EditorLocale = {
  code: "uk",
  name: "Ukrainian",
  isDefault: false,
  isEnabled: true,
};
export const HIDDEN_LOCALE: EditorLocale = {
  code: "de",
  name: "German",
  isDefault: false,
  isEnabled: false,
};

export const LOCALE_CATALOG: AdminLocaleListItem[] = [
  ENGLISH_LOCALE,
  UKRAINIAN_LOCALE,
  HIDDEN_LOCALE,
].map((locale, sortOrder) => ({
  ...locale,
  sortOrder,
  translatedSectionCount: 0,
  createdAt: FIXTURE_DATE,
  updatedAt: FIXTURE_DATE,
}));
