"use client";

import { Typography } from "@mui/material";

import { formatDate } from "@repo/shared";
import { IndicatorChip } from "@repo/ui";

const NEVER_PUBLISHED_LABEL = "Never published";
const LAST_PUBLISHED_PREFIX = "Last published ";

type MobileLinkPublishStatusProps = {
  publishedDayCount: number;
  lastPublishedAt: Date | null;
};

const formatLifetimePublishDate = (value: Date): string => {
  const publishedAt = new Date(value);
  const isCurrentYear = publishedAt.getFullYear() === new Date().getFullYear();

  return isCurrentYear ? formatDate(publishedAt, "day") : formatDate(publishedAt, "short");
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
      {formatLifetimePublishDate(lastPublishedAt)}
    </Typography>
  );
};
