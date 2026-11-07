import { type ReactElement } from "react";

import { LinearProgress, Stack, Typography } from "@mui/material";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

import { TRANSLATABLE_SECTION_COUNT } from "../constants";

const PROGRESS_HEIGHT = 0.75;
const PERCENT = 100;

type TranslationProgressProps = { language: AdminLocaleListItem };

export const TranslationProgress = ({
  language,
}: TranslationProgressProps): ReactElement | null => {
  if (language.isDefault) {
    return null;
  }

  return (
    <Stack spacing={0.5}>
      <LinearProgress
        variant="determinate"
        value={(language.translatedSectionCount / TRANSLATABLE_SECTION_COUNT) * PERCENT}
        aria-label={`${language.name} translation progress`}
        sx={(theme) => ({ height: theme.spacing(PROGRESS_HEIGHT), borderRadius: 1, flex: 1 })}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {language.translatedSectionCount} of {TRANSLATABLE_SECTION_COUNT} translated
      </Typography>
    </Stack>
  );
};
