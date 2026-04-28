"use client";

import { Chip, Stack, Typography } from "@mui/material";

import { type SchemeParams } from "@repo/contracts/lms/_domain";
import { type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { SetGroupPreview } from "./set-group-preview";

const formatScheme = (params: SchemeParams): string => {
  switch (params.kind) {
    case "NONE":
      return "Single block";
    case "COUNT_UP":
      return params.cap
        ? `Count up — ${params.cap.toString()}s cap`
        : params.rounds
          ? `Count up — ${params.rounds.toString()} rounds`
          : "Count up";
    case "COUNT_DOWN":
      return `Count down — ${params.durationSec.toString()}s`;
    case "INTERVAL_LOOP":
      return `Intervals — ${params.sets.toString()} sets`;
    case "EMOM_LOOP":
      return `EMOM — ${params.totalMinutes.toString()} min`;
    case "TIME_BOXED":
      return `Time-boxed — ${params.segments.length.toString()} segments`;
  }
};

type SegmentPreviewProps = {
  segment: PlanStructureSegment;
};

export const SegmentPreview = ({ segment }: SegmentPreviewProps) => (
  <Stack spacing={1} sx={{ p: 1 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="subtitle2" sx={{ flex: 1 }}>
        {segment.label ?? "Segment"}
      </Typography>
      <Chip label={formatScheme(segment.schemeParams)} size="small" variant="outlined" />
    </Stack>
    {segment.setGroups.map((sg) => (
      <SetGroupPreview key={sg.id} setGroup={sg} />
    ))}
  </Stack>
);
