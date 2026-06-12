"use client";

import { Stack } from "@mui/material";

import {
  appendTrack,
  dematerializeToFlat,
  materializeParallel,
} from "../lib/parallel-ladder-draft";

import type { DraftSeed, GroupDraft, RepetitionAxis, SchemaDraft } from "./axes/axis-draft.types";
import { AxisFieldSection } from "./axes/axis-field-section";
import { AxisModeButtonGrid } from "./axes/axis-mode-button-grid";
import { REPETITION_TILES } from "./axes/axis-modes";
import { type LadderTrack, LadderTrackStack } from "./axes/ladder-track-stack";
import { REPETITION_DEFAULTS, RepetitionAxisField } from "./axes/repetition-axis-field";
import { GroupIntoBoxCheckbox } from "./group-into-box-checkbox";

const REPETITION_LABEL = "repetition";
const LADDER_KIND = "ladder";
const FALLBACK_KIND: RepetitionAxis["kind"] = "once";

const ladderSteps = (schema: SchemaDraft): number[] =>
  schema.repetition?.kind === LADDER_KIND ? schema.repetition.steps : [];

const ladderRepetition = (steps: number[]): RepetitionAxis => ({ kind: LADDER_KIND, steps });

const flattenToKind = (group: GroupDraft, kind: RepetitionAxis["kind"]): SchemaDraft => ({
  id: group.id,
  header: group.header,
  notes: null,
  repetition: REPETITION_DEFAULTS[kind],
  rows: [],
});

const patchTrackSteps = (group: GroupDraft, trackIndex: number, steps: number[]): GroupDraft => ({
  ...group,
  tracks: group.tracks.map((track, index) => (index === trackIndex ? { ...track, steps } : track)),
});

type CreateSchemaFlowProps = {
  draft: DraftSeed;
  onDraftChange: (next: DraftSeed) => void;
  linkIntoBox?: boolean;
  onLinkIntoBoxChange?: ((checked: boolean) => void) | undefined;
};

export const CreateSchemaFlow: React.FC<CreateSchemaFlowProps> = ({
  draft,
  onDraftChange,
  linkIntoBox = true,
  onLinkIntoBoxChange,
}) => {
  const isGroup = draft.mode === "group";
  const activeKind: RepetitionAxis["kind"] = isGroup
    ? LADDER_KIND
    : (draft.schema.repetition?.kind ?? FALLBACK_KIND);

  const handleKind = (nextKind: RepetitionAxis["kind"]): void => {
    if (nextKind === activeKind) {
      return;
    }

    if (nextKind !== LADDER_KIND && draft.mode === "group") {
      onDraftChange({ mode: "schema", schema: flattenToKind(draft.group, nextKind) });

      return;
    }

    if (draft.mode === "schema") {
      onDraftChange({
        mode: "schema",
        schema: { ...draft.schema, repetition: REPETITION_DEFAULTS[nextKind] },
      });
    }
  };

  const handleRepetitionChange = (next: RepetitionAxis): void => {
    if (draft.mode === "schema") {
      onDraftChange({ mode: "schema", schema: { ...draft.schema, repetition: next } });
    }
  };

  const handleChangeTrack = (index: number, steps: number[]): void => {
    if (draft.mode === "group") {
      onDraftChange({ mode: "group", group: patchTrackSteps(draft.group, index, steps) });

      return;
    }

    onDraftChange({
      mode: "schema",
      schema: { ...draft.schema, repetition: ladderRepetition(steps) },
    });
  };

  const handleAppendTrack = (): void =>
    onDraftChange(
      draft.mode === "group"
        ? { mode: "group", group: appendTrack(draft.group) }
        : { mode: "group", group: materializeParallel(draft.schema) },
    );

  const handleRemoveTrack = (index: number): void => {
    if (draft.mode !== "group") {
      return;
    }

    const remaining: GroupDraft = {
      ...draft.group,
      tracks: draft.group.tracks.filter((_, trackIndex) => trackIndex !== index),
    };

    if (remaining.tracks.length !== 1) {
      onDraftChange({ mode: "group", group: remaining });

      return;
    }

    const flat = dematerializeToFlat(remaining);

    onDraftChange(
      "rows" in flat ? { mode: "schema", schema: flat } : { mode: "group", group: flat },
    );
  };

  if (activeKind !== LADDER_KIND && draft.mode === "schema") {
    return (
      <RepetitionAxisField
        value={draft.schema.repetition ?? REPETITION_DEFAULTS[FALLBACK_KIND]}
        onChange={handleRepetitionChange}
      />
    );
  }

  const tracks: LadderTrack[] = isGroup
    ? draft.group.tracks.map((track) => ({ id: track.id, steps: track.steps }))
    : [{ id: draft.schema.id, steps: ladderSteps(draft.schema) }];

  const ladderHint = REPETITION_TILES.find((tile) => tile.kind === LADDER_KIND)?.hint;

  return (
    <Stack direction="column" spacing={1}>
      <AxisFieldSection label={REPETITION_LABEL} hint={ladderHint}>
        <AxisModeButtonGrid
          label={REPETITION_LABEL}
          value={activeKind}
          tiles={REPETITION_TILES}
          onChange={handleKind}
        />
      </AxisFieldSection>

      <LadderTrackStack
        tracks={tracks}
        onChangeTrack={handleChangeTrack}
        onAppendTrack={handleAppendTrack}
        onRemoveTrack={handleRemoveTrack}
        isBoxed={linkIntoBox}
      />

      {isGroup && onLinkIntoBoxChange !== undefined ? (
        <GroupIntoBoxCheckbox checked={linkIntoBox} onChange={onLinkIntoBoxChange} />
      ) : null}
    </Stack>
  );
};
