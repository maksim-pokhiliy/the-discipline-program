"use client";

import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";

import { type PlanStructureBlock } from "@repo/contracts/lms/training-plan";

import { SegmentPreview } from "./segment-preview";

export type AthletePreviewProps = {
  block: PlanStructureBlock;
};

export const AthletePreview = ({ block }: AthletePreviewProps) => (
  <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          {block.title ?? "Block"}
        </Typography>
        <Chip label={block.status} size="small" />
        <Chip label={`weight ${block.weight.toString()}`} size="small" variant="outlined" />
      </Stack>

      {block.notes ? (
        <Box sx={{ bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {block.notes}
          </Typography>
        </Box>
      ) : null}

      <Divider />

      <Stack spacing={1}>
        {block.segments.length === 0 ? (
          <Typography variant="caption" color="text.muted">
            No segments
          </Typography>
        ) : (
          block.segments.map((segment) => <SegmentPreview key={segment.id} segment={segment} />)
        )}
      </Stack>

      <Typography variant="caption" color="text.muted">
        Read-only preview — full athlete UX lands in M3
      </Typography>
    </Stack>
  </Paper>
);
