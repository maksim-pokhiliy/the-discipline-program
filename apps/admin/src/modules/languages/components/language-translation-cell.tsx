import { type ReactElement } from "react";

import { Link, Stack } from "@mui/material";
import NextLink from "next/link";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

import { pagesTranslationPath } from "../constants";

import { TranslationProgress } from "./translation-progress";

type LanguageTranslationCellProps = { language: AdminLocaleListItem };

export const LanguageTranslationCell = ({
  language,
}: LanguageTranslationCellProps): ReactElement | null => {
  if (language.isDefault) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <TranslationProgress language={language} />
      <Link
        component={NextLink}
        href={pagesTranslationPath(language.code)}
        aria-label={`Translate ${language.name}`}
      >
        Translate
      </Link>
    </Stack>
  );
};
