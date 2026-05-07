"use client";

import { Typography } from "@mui/material";

import { type Prescription } from "@repo/contracts/lms/_domain";

import { formatPrescriptionSummary } from "../lib";

const EMPTY_PLACEHOLDER = "—";

type PrescriptionSummaryProps = { prescription: Prescription };

export const PrescriptionSummary: React.FC<PrescriptionSummaryProps> = ({ prescription }) => {
  const summary = formatPrescriptionSummary(prescription);

  if (summary === "") {
    return (
      <Typography variant="body2" color="text.secondary">
        {EMPTY_PLACEHOLDER}
      </Typography>
    );
  }

  return <Typography variant="body2">{summary}</Typography>;
};
