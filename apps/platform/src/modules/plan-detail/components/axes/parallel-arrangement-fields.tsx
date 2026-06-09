"use client";

import { type MouseEvent } from "react";

import { FormControlLabel, Stack, Switch, ToggleButton, Typography } from "@mui/material";

import { LabeledToggleGroup } from "@repo/ui";

import type { ArrangementTargetRef } from "../../lib/arrangement-targets";

import type { ArrangementAxis, NodeId, ParallelTrackDraft } from "./axis-draft.types";

type ParallelArrangement = Extract<ArrangementAxis, { kind: "parallel" }>;

const INTERLEAVE_LABEL = "interleave";
const TRACKS_LABEL = "Tracks (pick the child groups that run in parallel)";
const TRACK_LABEL = "track";

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

type ParallelArrangementFieldsProps = {
  value: ParallelArrangement;
  onChange: (next: ArrangementAxis) => void;
  childContainers: ArrangementTargetRef[];
  disabled?: boolean;
};

export const ParallelArrangementFields: React.FC<ParallelArrangementFieldsProps> = ({
  value,
  onChange,
  childContainers,
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
        const isTrack = findTrack(value.tracks, child.id) !== undefined;

        return (
          <FormControlLabel
            key={child.id}
            control={
              <Switch
                checked={isTrack}
                onChange={(event) => toggleTrack(child.id, event.target.checked)}
                disabled={disabled}
              />
            }
            label={`${TRACK_LABEL} · ${child.label}`}
          />
        );
      })}
    </Stack>
  );
};
