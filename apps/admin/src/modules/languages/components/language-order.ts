import { type AdminLocaleListItem, type LocaleCode } from "@repo/contracts/cms/locale";

export type MoveDirection = "up" | "down";
export type LanguageRow = AdminLocaleListItem & {
  id: LocaleCode;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export const toLanguageRows = (locales: readonly AdminLocaleListItem[]): LanguageRow[] => {
  const movable = locales.filter((locale) => !locale.isDefault);

  return locales.map((locale) => {
    const index = movable.findIndex(({ code }) => code === locale.code);

    return {
      ...locale,
      id: locale.code,
      canMoveUp: !locale.isDefault && index > 0,
      canMoveDown: !locale.isDefault && index < movable.length - 1,
    };
  });
};

export const moveLanguage = (
  locales: readonly AdminLocaleListItem[],
  code: LocaleCode,
  direction: MoveDirection,
): LocaleCode[] => {
  const codes = locales.filter((locale) => !locale.isDefault).map((locale) => locale.code);
  const index = codes.indexOf(code);
  const nextIndex = index + (direction === "up" ? -1 : 1);
  const current = codes[index];
  const neighbour = codes[nextIndex];

  if (index < 0 || current === undefined || neighbour === undefined) {
    return codes;
  }

  codes[index] = neighbour;
  codes[nextIndex] = current;

  return codes;
};
