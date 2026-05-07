"use client";

import { Typography } from "@mui/material";

import { type SchemeParams } from "@repo/contracts/lms/_domain";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

import { formatSchemeSummary } from "../lib";

type SchemeSummaryProps = { schemeType: SchemeType | null; params: SchemeParams };

export const SchemeSummary: React.FC<SchemeSummaryProps> = ({ schemeType, params }) => {
  if (schemeType === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        (deleted scheme)
      </Typography>
    );
  }

  return <Typography variant="body2">{formatSchemeSummary(schemeType, params)}</Typography>;
};
