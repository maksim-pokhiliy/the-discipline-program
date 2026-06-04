"use client";

import { type MouseEvent } from "react";

import {
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  Typography,
} from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import { StepArrayFields } from "../../../components/step-array-fields";
import type { ArrangementAxis, NodeId, ParallelTrackDraft } from "../../compose-tree.types";
import type { ArrangementTargetRef } from "../../lib/arrangement-targets";

type ParallelArrangement = Extract<ArrangementAxis, { kind: "parallel" }>;

const INTERLEAVE_LABEL = "interleave";
const TRACKS_LABEL = "Tracks (pick the child groups that run in parallel)";
const TRACK_LABEL = "track";
const PAIRED_LABEL = "paired with row";
const PAIRED_NONE_LABEL = "— none —";
const PAIRED_NONE_VALUE = "";
const PAIRED_WIDTH = 260;

const INTERLEAVE_OPTIONS: { value: ParallelArrangement["interleaveOrder"]; label: string }[] = [
  { value: "round_by_round", label: "round by round" },
  { value: "track_by_track", label: "track by track" },
];

const findTrack = (
  tracks: ParallelTrackDraft[],
  childSchemaId: NodeId,
): ParallelTrackDraft | undefined => tracks.find((track) => track.childSchemaId === childSchemaId);

const withoutTrack = (tracks: ParallelTrackDraft[], childSchemaId: NodeId): ParallelTrackDraft[] =>
  tracks.filter((track) => track.childSchemaId !== childSchemaId);

const patchTrack = (
  tracks: ParallelTrackDraft[],
  childSchemaId: NodeId,
  patch: (track: ParallelTrackDraft) => ParallelTrackDraft,
): ParallelTrackDraft[] =>
  tracks.map((track) => (track.childSchemaId === childSchemaId ? patch(track) : track));

const withEnumeration = (track: ParallelTrackDraft, steps: number[]): ParallelTrackDraft => ({
  childSchemaId: track.childSchemaId,
  ...(steps.length > 0 && { setEnumeration: steps }),
  ...(track.pairedWithRowId !== undefined && { pairedWithRowId: track.pairedWithRowId }),
});

const withPairedRow = (
  track: ParallelTrackDraft,
  pairedWithRowId: NodeId | undefined,
): ParallelTrackDraft => ({
  childSchemaId: track.childSchemaId,
  ...(track.setEnumeration !== undefined && { setEnumeration: track.setEnumeration }),
  ...(pairedWithRowId !== undefined && { pairedWithRowId }),
});

const pairedOptionsFor = (
  childSchemaId: NodeId,
  tracks: ParallelTrackDraft[],
  rowsByTrack: Record<string, ArrangementTargetRef[]>,
): ArrangementTargetRef[] =>
  tracks
    .filter((track) => track.childSchemaId !== childSchemaId)
    .flatMap((track) => rowsByTrack[track.childSchemaId] ?? []);

type ParallelArrangementFieldsProps = {
  value: ParallelArrangement;
  onChange: (next: ArrangementAxis) => void;
  childContainers: ArrangementTargetRef[];
  rowsByTrack: Record<string, ArrangementTargetRef[]>;
  disabled?: boolean;
};

export const ParallelArrangementFields: React.FC<ParallelArrangementFieldsProps> = ({
  value,
  onChange,
  childContainers,
  rowsByTrack,
  disabled = false,
}) => {
  const setTracks = (tracks: ParallelTrackDraft[]): void => onChange({ ...value, tracks });

  const setInterleave = (
    _: MouseEvent<HTMLElement>,
    next: ParallelArrangement["interleaveOrder"] | null,
  ): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, interleaveOrder: next });
  };

  const toggleTrack = (childSchemaId: NodeId, isOn: boolean): void =>
    setTracks(
      isOn ? [...value.tracks, { childSchemaId }] : withoutTrack(value.tracks, childSchemaId),
    );

  const setEnumeration = (childSchemaId: NodeId, steps: number[]): void =>
    setTracks(patchTrack(value.tracks, childSchemaId, (track) => withEnumeration(track, steps)));

  const setPairedWith = (
    childSchemaId: NodeId,
    options: ArrangementTargetRef[],
    rawRowId: string,
  ): void => {
    const picked = options.find((row) => row.id === rawRowId);

    setTracks(patchTrack(value.tracks, childSchemaId, (track) => withPairedRow(track, picked?.id)));
  };

  return (
    <Stack direction="column" spacing={1}>
      <LabeledToggleGroup
        label={INTERLEAVE_LABEL}
        value={value.interleaveOrder}
        onChange={setInterleave}
        disabled={disabled}
      >
        {INTERLEAVE_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </LabeledToggleGroup>

      <Typography variant="caption" color="text.subtle">
        {TRACKS_LABEL}
      </Typography>

      {childContainers.map((child) => {
        const track = findTrack(value.tracks, child.id);
        const isTrack = track !== undefined;
        const pairedOptions = pairedOptionsFor(child.id, value.tracks, rowsByTrack);

        return (
          <Stack key={child.id} direction="column" spacing={0.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={isTrack}
                  onChange={(event) => toggleTrack(child.id, event.target.checked)}
                  disabled={disabled}
                />
              }
              label={`${TRACK_LABEL} · ${child.label}`}
            />

            {isTrack ? (
              <Stack direction="column" spacing={0.5} sx={{ pl: 2 }}>
                <StepArrayFields
                  value={track.setEnumeration ?? []}
                  onChange={(steps) => setEnumeration(child.id, steps)}
                  disabled={disabled}
                />

                <TextField
                  select
                  size="small"
                  label={PAIRED_LABEL}
                  value={track.pairedWithRowId ?? PAIRED_NONE_VALUE}
                  onChange={(event) => setPairedWith(child.id, pairedOptions, event.target.value)}
                  disabled={disabled}
                  sx={{ maxWidth: PAIRED_WIDTH }}
                >
                  <MenuItem value={PAIRED_NONE_VALUE}>{PAIRED_NONE_LABEL}</MenuItem>

                  {pairedOptions.map((row) => (
                    <MenuItem key={row.id} value={row.id}>
                      {row.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};
