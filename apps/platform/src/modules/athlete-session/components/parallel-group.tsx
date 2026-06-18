import { type ReactElement } from "react";

import CallSplitRounded from "@mui/icons-material/CallSplitRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type SchemaCardView } from "@repo/contracts/lms/session-detail";

import {
  FONT_WEIGHT_DISPLAY,
  GROUP_BORDER_ALPHA,
  GROUP_BORDER_WIDTH_PX,
  GROUP_ICON_PX,
  GROUP_LABEL_LETTER_SPACING,
  GROUP_LABEL_PX,
  GROUP_PAD_PX,
  PARALLEL_GROUP_LABEL,
  SCHEMA_GAP_PX,
  SCHEMA_TRACK_ALPHA,
  SCHEMA_TRACK_PX,
  SUMMARY_SEPARATOR,
  TRACK_LABEL_LETTER_SPACING,
  TRACK_PREFIX_LABEL,
  TRACKS_SUFFIX_LABEL,
} from "../utils/athlete-session.constants";

import { SchemaCard } from "./schema-card";

const FIRST_TRACK_OFFSET = 1;

export type ParallelGroupTrack = {
  header: string | null;
  schema: SchemaCardView;
};

export type ParallelGroupProps = {
  trackCount: number;
  tracks: ParallelGroupTrack[];
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
};

export const ParallelGroup = ({
  trackCount,
  tracks,
  onSetOneRm,
  onPickProfile,
}: ParallelGroupProps): ReactElement => (
  <Box
    sx={(theme) => ({
      borderLeft: `${GROUP_BORDER_WIDTH_PX}px solid ${alpha(theme.palette.primary.main, GROUP_BORDER_ALPHA)}`,
      pl: `${GROUP_PAD_PX}px`,
    })}
  >
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={(theme) => ({ mb: 1, color: theme.palette.primary.main })}
    >
      <CallSplitRounded sx={{ fontSize: GROUP_ICON_PX }} />
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(GROUP_LABEL_PX),
          fontWeight: FONT_WEIGHT_DISPLAY,
          letterSpacing: GROUP_LABEL_LETTER_SPACING,
          textTransform: "uppercase",
        })}
      >
        {`${PARALLEL_GROUP_LABEL}${SUMMARY_SEPARATOR}${trackCount} ${TRACKS_SUFFIX_LABEL}`}
      </Typography>
    </Stack>

    <Stack spacing={`${SCHEMA_GAP_PX}px`}>
      {tracks.map((track, index) => (
        <Box key={track.schema.schemaId}>
          <Typography
            component="div"
            sx={(theme) => ({
              mb: 0.75,
              fontSize: theme.typography.pxToRem(SCHEMA_TRACK_PX),
              fontWeight: FONT_WEIGHT_DISPLAY,
              letterSpacing: TRACK_LABEL_LETTER_SPACING,
              textTransform: "uppercase",
              color: alpha(theme.palette.common.white, SCHEMA_TRACK_ALPHA),
            })}
          >
            {track.header ?? `${TRACK_PREFIX_LABEL} ${index + FIRST_TRACK_OFFSET}`}
          </Typography>
          <SchemaCard schema={track.schema} onSetOneRm={onSetOneRm} onPickProfile={onPickProfile} />
        </Box>
      ))}
    </Stack>
  </Box>
);
