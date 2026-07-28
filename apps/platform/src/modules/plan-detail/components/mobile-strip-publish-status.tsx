"use client";

import { Typography } from "@mui/material";

import { IndicatorChip } from "@repo/ui";

import { formatPublishDate } from "../lib/format-publish-date";
import { type StripPublishStatus } from "../lib/summarize-strip-publish-status";

const WEEK_SENT_PREFIX = "This week: sent ";
const CHECKING_LABEL = "Checking this week…";

type MobileStripPublishStatusProps = {
  status: StripPublishStatus;
};

export const MobileStripPublishStatus: React.FC<MobileStripPublishStatusProps> = ({ status }) => {
  if (status.kind === "none") {
    return null;
  }

  if (status.kind === "checking") {
    return (
      <Typography variant="caption" color="text.secondary">
        {CHECKING_LABEL}
      </Typography>
    );
  }

  const weekCaption =
    status.weekPublishedAt === null ? null : (
      <Typography variant="caption" color="text.secondary">
        {WEEK_SENT_PREFIX}
        {formatPublishDate(status.weekPublishedAt)}
      </Typography>
    );

  if (status.kind === "week-published") {
    return weekCaption;
  }

  if (status.kind === "week-pending") {
    return (
      <>
        <IndicatorChip tone="info" label={status.label} />

        {weekCaption}
      </>
    );
  }

  return (
    <>
      <IndicatorChip tone="warning" label={status.label} />

      {status.weekPendingLabel !== null && (
        <IndicatorChip tone="info" label={status.weekPendingLabel} />
      )}

      {weekCaption}
    </>
  );
};
