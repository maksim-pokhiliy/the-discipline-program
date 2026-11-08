"use client";

import { type ReactNode } from "react";

import { Alert } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { LoadingState } from "@repo/ui";
import { NotFoundPageContent } from "@repo/ui/error-pages";

import { useLocales } from "@app/lib/hooks";

import { LOCALE_PARAM } from "../../config/locale-url";

import { resolveLocaleParam, type EditorLocale } from "./resolve-locale-param";

export {
  DEFAULT_EDITOR_LOCALE,
  resolveLocaleParam,
  type EditorLocale,
  type LocaleParamResolution,
} from "./resolve-locale-param";

type LocaleGateProps = { children: (locale: EditorLocale) => ReactNode };

export const LocaleGate = ({ children }: LocaleGateProps): ReactNode => {
  const searchParams = useSearchParams();
  const catalog = useLocales();
  const resolution = resolveLocaleParam(searchParams.get(LOCALE_PARAM), catalog);

  switch (resolution.kind) {
    case "loading":
      return <LoadingState message="Loading languages..." />;
    case "failed":
      return <Alert severity="error">Failed to load data</Alert>;
    case "notFound":
      return <NotFoundPageContent homeLabel="Go to dashboard" />;
    case "resolved":
      return children(resolution.locale);
  }
};
