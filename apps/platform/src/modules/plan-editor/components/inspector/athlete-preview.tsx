"use client";

import { Box, Checkbox, Chip, Divider, Paper, Stack, Typography } from "@mui/material";

import { type SchemeParams } from "@repo/contracts/lms/_domain";
import {
  type PlanStructureBlock,
  type PlanStructureSegment,
  type PlanStructureSetGroup,
} from "@repo/contracts/lms/training-plan";

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

const SetGroupPreview = ({ setGroup }: { setGroup: PlanStructureSetGroup }) => (
  <Stack spacing={0.5} sx={{ pl: 1 }}>
    {setGroup.label ? (
      <Typography variant="caption" color="text.secondary">
        {setGroup.label}
      </Typography>
    ) : null}

    {setGroup.entries.map((entry) => (
      <Stack key={entry.id} direction="row" alignItems="center" spacing={1}>
        <Checkbox size="small" disabled />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="body2">{entry.exerciseSnapshot.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {entry.prescription.reps?.kind === "FIXED"
              ? `${entry.prescription.reps.value.toString()} reps`
              : entry.prescription.reps?.kind === "RANGE"
                ? `${entry.prescription.reps.min.toString()}-${entry.prescription.reps.max.toString()} reps`
                : entry.prescription.durationSec
                  ? `${entry.prescription.durationSec.toString()}s`
                  : entry.prescription.distanceM
                    ? `${entry.prescription.distanceM.toString()}m`
                    : entry.prescription.calories
                      ? `${entry.prescription.calories.toString()} cal`
                      : "—"}
          </Typography>
        </Stack>
      </Stack>
    ))}
  </Stack>
);

const SegmentPreview = ({ segment }: { segment: PlanStructureSegment }) => (
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
          <Typography variant="caption" color="text.disabled">
            No segments
          </Typography>
        ) : (
          block.segments.map((segment) => <SegmentPreview key={segment.id} segment={segment} />)
        )}
      </Stack>

      <Typography variant="caption" color="text.disabled">
        Read-only preview — full athlete UX lands in M3
      </Typography>
    </Stack>
  </Paper>
);
