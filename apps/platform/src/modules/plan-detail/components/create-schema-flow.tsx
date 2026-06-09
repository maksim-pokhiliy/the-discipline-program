"use client";

import { Stack } from "@mui/material";

import { collectTrackChildren } from "../lib/arrangement-tree";
import { hasLadderMarkerConflict, LADDER_MARKER_CONFLICT } from "../lib/ladder-marker-conflict";
import {
  appendTrack,
  dematerializeToFlat,
  isParallelDraft,
  materializeParallel,
} from "../lib/parallel-ladder-draft";

import type { ComposeContainer, ComposeNode, RepetitionAxis } from "./axes/axis-draft.types";
import { AxisFieldSection } from "./axes/axis-field-section";
import { AxisModeButtonGrid } from "./axes/axis-mode-button-grid";
import { REPETITION_TILES } from "./axes/axis-modes";
import { LadderTrackStack } from "./axes/ladder-track-stack";
import { REPETITION_DEFAULTS, RepetitionAxisField } from "./axes/repetition-axis-field";

const REPETITION_LABEL = "repetition";
const LADDER_KIND = "ladder";
const FALLBACK_KIND: RepetitionAxis["kind"] = "once";

const ladderSteps = (container: ComposeContainer): number[] =>
  container.repetition?.kind === LADDER_KIND ? container.repetition.steps : [];

const ladderRepetition = (steps: number[]): RepetitionAxis => ({ kind: LADDER_KIND, steps });

const flattenToKind = (
  draft: ComposeContainer,
  kind: RepetitionAxis["kind"],
): ComposeContainer => ({
  nodeType: "container",
  id: draft.id,
  header: draft.header,
  notes: draft.notes,
  repetition: REPETITION_DEFAULTS[kind],
  children: [],
});

const patchTrackSteps = (
  draft: ComposeContainer,
  index: number,
  steps: number[],
): ComposeContainer => ({
  ...draft,
  children: draft.children.map(
    (child, childIndex): ComposeNode =>
      childIndex === index && child.nodeType === "container"
        ? { ...child, repetition: ladderRepetition(steps) }
        : child,
  ),
});

const removeTrack = (draft: ComposeContainer, index: number): ComposeContainer => {
  const remaining: ComposeContainer = {
    ...draft,
    children: draft.children.filter((_, childIndex) => childIndex !== index),
  };

  return collectTrackChildren(remaining).length === 1 ? dematerializeToFlat(remaining) : remaining;
};

type CreateSchemaFlowProps = {
  draft: ComposeContainer;
  onDraftChange: (next: ComposeContainer) => void;
};

export const CreateSchemaFlow: React.FC<CreateSchemaFlowProps> = ({ draft, onDraftChange }) => {
  const activeKind = draft.repetition?.kind ?? FALLBACK_KIND;
  const ladderError = hasLadderMarkerConflict(draft) ? LADDER_MARKER_CONFLICT : undefined;

  const handleKind = (nextKind: RepetitionAxis["kind"]): void => {
    if (nextKind === activeKind) {
      return;
    }

    if (nextKind !== LADDER_KIND && isParallelDraft(draft)) {
      onDraftChange(flattenToKind(draft, nextKind));

      return;
    }

    onDraftChange({ ...draft, repetition: REPETITION_DEFAULTS[nextKind] });
  };

  const handleRepetitionChange = (next: RepetitionAxis): void =>
    onDraftChange({ ...draft, repetition: next });

  const handleChangeTrack = (index: number, steps: number[]): void =>
    onDraftChange(
      isParallelDraft(draft)
        ? patchTrackSteps(draft, index, steps)
        : { ...draft, repetition: ladderRepetition(steps) },
    );

  const handleAppendTrack = (): void =>
    onDraftChange(isParallelDraft(draft) ? appendTrack(draft) : materializeParallel(draft));

  const handleRemoveTrack = (index: number): void => onDraftChange(removeTrack(draft, index));

  if (activeKind !== LADDER_KIND) {
    return (
      <RepetitionAxisField
        value={draft.repetition ?? REPETITION_DEFAULTS[FALLBACK_KIND]}
        onChange={handleRepetitionChange}
      />
    );
  }

  const tracks = isParallelDraft(draft)
    ? collectTrackChildren(draft).map(ladderSteps)
    : [ladderSteps(draft)];

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
        error={ladderError}
      />
    </Stack>
  );
};
