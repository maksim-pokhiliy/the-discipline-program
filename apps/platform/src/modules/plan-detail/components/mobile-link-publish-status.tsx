"use client";

import { Typography } from "@mui/material";

import { IndicatorChip } from "@repo/ui";

import { formatPublishDate } from "../lib/format-publish-date";

const NEVER_PUBLISHED_LABEL = "Never published";
const LAST_PUBLISHED_PREFIX = "Last published ";

type MobileLinkPublishStatusProps = {
  publishedDayCount: number;
  lastPublishedAt: Date | null;
};

export const MobileLinkPublishStatus: React.FC<MobileLinkPublishStatusProps> = ({
  publishedDayCount,
  lastPublishedAt,
}) => {
  if (publishedDayCount === 0) {
    return <IndicatorChip tone="warning" label={NEVER_PUBLISHED_LABEL} />;
  }

  if (lastPublishedAt === null) {
    return null;
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {LAST_PUBLISHED_PREFIX}
      {formatPublishDate(lastPublishedAt)}
    </Typography>
  );
};
