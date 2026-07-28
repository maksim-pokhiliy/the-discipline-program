"use client";

import { Typography } from "@mui/material";

import { formatDate } from "@repo/shared";
import { IndicatorChip } from "@repo/ui";

const NEVER_PUBLISHED_LABEL = "Never published";
const NEVER_PUBLISHED_SUFFIX = " never published";
const LAST_PUBLISHED_PREFIX = "Last published ";

type MobileLinkPublishStatusProps = {
  neverPublishedCount: number;
  totalCount: number;
  lastPublishedAt: Date | null;
};

export const MobileLinkPublishStatus: React.FC<MobileLinkPublishStatusProps> = ({
  neverPublishedCount,
  totalCount,
  lastPublishedAt,
}) => {
  if (neverPublishedCount > 0) {
    const label =
      neverPublishedCount === totalCount
        ? NEVER_PUBLISHED_LABEL
        : `${neverPublishedCount}${NEVER_PUBLISHED_SUFFIX}`;

    return <IndicatorChip tone="warning" label={label} />;
  }

  if (lastPublishedAt === null) {
    return null;
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {LAST_PUBLISHED_PREFIX}
      {formatDate(lastPublishedAt, "day")}
    </Typography>
  );
};
