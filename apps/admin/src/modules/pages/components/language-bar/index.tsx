"use client";

import { type ReactElement } from "react";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type LocaleCode } from "@repo/contracts/cms/locale";

import { useLocales } from "@app/lib/hooks";

import { withLocaleParam } from "../../config/locale-url";
import { LanguageBanner } from "../language-banner";
import { LanguageSwitch } from "../language-switch";
import { type EditorLocale } from "../locale-gate";

type LanguageBarProps = { locale: EditorLocale };

export const LanguageBar = ({ locale }: LanguageBarProps): ReactElement => {
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
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems="flex-start"
      sx={{ position: "sticky", top: 0, zIndex: "appBar", bgcolor: "background.default", py: 2 }}
    >
      <LanguageBanner locale={locale} />
      <LanguageSwitch locale={locale} catalog={catalog} onChange={handleChange} />
    </Stack>
  );
};
