"use client";

import { Chip } from "@mui/material";

import type { TimeCap } from "@repo/contracts/lms/_shared";

type BlockTimeCapSummaryProps = {
  timeCap: TimeCap | null;
};

const formatTimeCap = (tc: TimeCap): string => {
  if (tc.max !== undefined) {
    return `${tc.min}-${tc.max} ${tc.unit} cap`;
  }

  return `${tc.min} ${tc.unit} cap`;
};

export const BlockTimeCapSummary = ({ timeCap }: BlockTimeCapSummaryProps) => {
  if (timeCap === null) {
    return null;
  }

  return <Chip size="small" label={formatTimeCap(timeCap)} />;
};
