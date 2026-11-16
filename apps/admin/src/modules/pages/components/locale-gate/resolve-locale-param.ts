import {
  DEFAULT_LOCALE_CODE,
  DEFAULT_LOCALE_NAME,
  type AdminLocaleListItem,
} from "@repo/contracts/cms/locale";

export type EditorLocale = Pick<AdminLocaleListItem, "code" | "name" | "isDefault" | "isEnabled">;

export const DEFAULT_EDITOR_LOCALE: EditorLocale = {
  code: DEFAULT_LOCALE_CODE,
  name: DEFAULT_LOCALE_NAME,
  isDefault: true,
  isEnabled: true,
};

export type LocaleParamResolution =
  | { kind: "resolved"; locale: EditorLocale }
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "notFound" };

type LocaleCatalog = { data: readonly AdminLocaleListItem[] | undefined; isError: boolean };

export const resolveLocaleParam = (
  param: string | null,
  catalog: LocaleCatalog,
): LocaleParamResolution => {
  if (param === null || param === "" || param === DEFAULT_LOCALE_CODE) {
    return { kind: "resolved", locale: DEFAULT_EDITOR_LOCALE };
  }

  if (catalog.data === undefined) {
    return { kind: catalog.isError ? "failed" : "loading" };
  }

  const locale = catalog.data.find(({ code }) => code === param);

  return locale ? { kind: "resolved", locale } : { kind: "notFound" };
};
