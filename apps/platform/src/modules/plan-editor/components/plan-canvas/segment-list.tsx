"use client";

import { Stack, Typography } from "@mui/material";
import { Virtuoso } from "react-virtuoso";

import { type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { SegmentRow } from "./segment-row";
import { type PlanSelection } from "./selection";

const VIRTUALIZE_THRESHOLD = 20;

type SegmentListProps = {
  segments: PlanStructureSegment[];
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

export const SegmentList = ({ segments, selection, onSelect }: SegmentListProps) => {
  if (segments.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
        No segments
      </Typography>
    );
  }

  if (segments.length > VIRTUALIZE_THRESHOLD) {
    return (
      <Virtuoso
        style={{ height: 320 }}
        totalCount={segments.length}
        itemContent={(index) => {
          const segment = segments[index];

          if (!segment) {
            return null;
          }

          return <SegmentRow segment={segment} selection={selection} onSelect={onSelect} />;
        }}
      />
    );
  }

  return (
    <Stack spacing={0.5}>
      {segments.map((segment) => (
        <SegmentRow key={segment.id} segment={segment} selection={selection} onSelect={onSelect} />
      ))}
    </Stack>
  );
};
