import { type ReactElement } from "react";

import { LinearProgress, Stack, Typography } from "@mui/material";

import { rateToPercent } from "@repo/shared";

const PROGRESS_HEIGHT = 0.75;

type PageTranslationProgressProps = {
  pageLabel: string;
  translatedCount: number;
  sectionCount: number;
};

export const PageTranslationProgress = ({
  pageLabel,
  translatedCount,
  sectionCount,
}: PageTranslationProgressProps): ReactElement => (
  <Stack spacing={0.5}>
    <LinearProgress
      variant="determinate"
      value={rateToPercent(translatedCount / sectionCount)}
      aria-label={`${pageLabel} translation progress`}
      sx={(theme) => ({ height: theme.spacing(PROGRESS_HEIGHT), borderRadius: 1 })}
    />
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontVariantNumeric: "tabular-nums" }}
    >
      {translatedCount} of {sectionCount} translated
    </Typography>
  </Stack>
);
