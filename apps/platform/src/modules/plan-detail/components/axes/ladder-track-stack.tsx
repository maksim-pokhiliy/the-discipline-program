"use client";

import { Fragment } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Divider, FormHelperText, IconButton, Stack, Typography } from "@mui/material";

import { PlusRowButton } from "@repo/ui";

import { StepArrayFields } from "../step-array-fields";

import type { NodeId } from "./axis-draft.types";

const STACK_SPACING = 1.5;
const UNBOXED_STACK_SPACING = 2.5;
const TRACK_SPACING = 0.75;
const ADD_TRACK_LABEL = "another ladder";
const TRACK_LABEL_PREFIX = "LADDER";
const REMOVE_TRACK_LABEL_PREFIX = "Remove ladder";
const TRACK_LABEL_FONT_SIZE_PX = 11;
const TRACK_LABEL_FONT_WEIGHT = 600;
const TRACK_LABEL_LETTER_SPACING = "0.06em";

export type LadderTrack = { id: NodeId; steps: number[] };

type LadderTrackStackProps = {
  tracks: ReadonlyArray<LadderTrack>;
  onChangeTrack: (index: number, steps: number[]) => void;
  onAppendTrack: () => void;
  onRemoveTrack: (index: number) => void;
  error?: string | undefined;
  isBoxed?: boolean;
};

export const LadderTrackStack: React.FC<LadderTrackStackProps> = ({
  tracks,
  onChangeTrack,
  onAppendTrack,
  onRemoveTrack,
  error,
  isBoxed = true,
}) => {
  const hasMultipleTracks = tracks.length > 1;

  return (
    <Stack direction="column" spacing={isBoxed ? STACK_SPACING : UNBOXED_STACK_SPACING}>
      {tracks.map((track, index) => (
        <Fragment key={track.id}>
          {!isBoxed && index > 0 ? <Divider sx={{ borderColor: "divider" }} /> : null}

          <Stack direction="column" spacing={TRACK_SPACING}>
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

            <StepArrayFields value={track.steps} onChange={(next) => onChangeTrack(index, next)} />
          </Stack>
        </Fragment>
      ))}

      <PlusRowButton onClick={onAppendTrack} label={ADD_TRACK_LABEL} />

      {error !== undefined ? <FormHelperText error>{error}</FormHelperText> : null}
    </Stack>
  );
};
