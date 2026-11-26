"use client";

import { type ReactElement, type ReactNode } from "react";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type LocaleCode } from "@repo/contracts/cms/locale";

import { withLocaleParam } from "@app/lib/config/locale-url";
import { useLocales } from "@app/lib/hooks";

import { LanguageSwitch } from "../language-switch";
import { type EditorLocale } from "../locale-gate";

type EditorLanguageBarProps = { locale: EditorLocale; children: ReactNode };

export const EditorLanguageBar = ({ locale, children }: EditorLanguageBarProps): ReactElement => {
  const { data: catalog } = useLocales();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handleChange = (code: LocaleCode): void => {
    const query = withLocaleParam(new URLSearchParams(searchParams.toString()), code).toString();

    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Stack
      direction="column"
      spacing={2}
      alignItems="flex-start"
      sx={{ position: "sticky", top: 0, zIndex: "appBar", bgcolor: "background.default", py: 2 }}
    >
      {children}
      <LanguageSwitch locale={locale} catalog={catalog} onChange={handleChange} />
    </Stack>
  );
};
