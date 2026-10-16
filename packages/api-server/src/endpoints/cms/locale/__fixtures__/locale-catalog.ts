import { cleanupRaw } from "../../../../test/helpers";

export const UKRAINIAN = { code: "uk", name: "Українська", isEnabled: true, sortOrder: 1 };
export const GERMAN = { code: "de", name: "Deutsch", isEnabled: false, sortOrder: 2 };
export const FRENCH = { code: "fr", name: "Français", isEnabled: true, sortOrder: 3 };
export const CATALAN = { code: "ca", name: "Català", isEnabled: true, sortOrder: 3 };
export const SEEDED_LOCALES = [UKRAINIAN, GERMAN, FRENCH, CATALAN];

export const seedLocaleCatalog = async (): Promise<void> => {
  await cleanupRaw.marketingLocale.createMany({ data: SEEDED_LOCALES });
};
