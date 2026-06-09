"use client";

import CloseIcon from "@mui/icons-material/Close";
import { FormHelperText, IconButton, Stack, Typography } from "@mui/material";

import { PlusRowButton } from "@repo/ui";

import { StepArrayFields } from "../step-array-fields";

const STACK_SPACING = 1.5;
const TRACK_SPACING = 0.75;
const ADD_TRACK_LABEL = "another ladder";
const TRACK_LABEL_PREFIX = "LADDER";
const REMOVE_TRACK_LABEL_PREFIX = "Remove ladder";
const TRACK_LABEL_FONT_SIZE_PX = 11;
const TRACK_LABEL_FONT_WEIGHT = 600;
const TRACK_LABEL_LETTER_SPACING = "0.06em";

type LadderTrackStackProps = {
  tracks: number[][];
  onChangeTrack: (index: number, steps: number[]) => void;
  onAppendTrack: () => void;
  onRemoveTrack: (index: number) => void;
  error?: string | undefined;
};

export const LadderTrackStack: React.FC<LadderTrackStackProps> = ({
  tracks,
  onChangeTrack,
  onAppendTrack,
  onRemoveTrack,
  error,
}) => {
  const hasMultipleTracks = tracks.length > 1;

  return (
    <Stack direction="column" spacing={STACK_SPACING}>
      {tracks.map((steps, index) => (
        <Stack key={index} direction="column" spacing={TRACK_SPACING}>
          {hasMultipleTracks ? (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Typography
                variant="caption"
                color="text.subtle"
                sx={{
                  fontSize: TRACK_LABEL_FONT_SIZE_PX,
                  fontWeight: TRACK_LABEL_FONT_WEIGHT,
                  letterSpacing: TRACK_LABEL_LETTER_SPACING,
                  textTransform: "uppercase",
                }}
              >
                {`${TRACK_LABEL_PREFIX} ${index + 1}`}
              </Typography>

              <IconButton
                aria-label={`${REMOVE_TRACK_LABEL_PREFIX} ${index + 1}`}
                size="small"
                onClick={() => onRemoveTrack(index)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}

          <StepArrayFields value={steps} onChange={(next) => onChangeTrack(index, next)} />
        </Stack>
      ))}

      <PlusRowButton onClick={onAppendTrack} label={ADD_TRACK_LABEL} />

      {error !== undefined ? <FormHelperText error>{error}</FormHelperText> : null}
    </Stack>
  );
};
