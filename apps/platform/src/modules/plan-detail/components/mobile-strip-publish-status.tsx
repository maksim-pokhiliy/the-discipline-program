"use client";

import { Typography } from "@mui/material";

import { formatDate } from "@repo/shared";
import { IndicatorChip, type IndicatorChipTone } from "@repo/ui";

import { type StripPublishStatus } from "../lib/summarize-strip-publish-status";

const WEEK_PUBLISHED_PREFIX = "This week published ";

const CHIP_TONE_BY_KIND: Record<"never-published" | "week-pending", IndicatorChipTone> = {
  "never-published": "warning",
  "week-pending": "info",
};

type MobileStripPublishStatusProps = {
  status: StripPublishStatus;
};

export const MobileStripPublishStatus: React.FC<MobileStripPublishStatusProps> = ({ status }) => {
  if (status.kind === "none") {
    return null;
  }

  const weekCaption =
    status.weekPublishedAt === null ? null : (
      <Typography variant="caption" color="text.secondary">
        {WEEK_PUBLISHED_PREFIX}
        {formatDate(status.weekPublishedAt, "day")}
      </Typography>
    );

  if (status.kind === "week-published") {
    return weekCaption;
  }

  return (
    <>
      <IndicatorChip tone={CHIP_TONE_BY_KIND[status.kind]} label={status.label} />

      {weekCaption}
    </>
  );
};
