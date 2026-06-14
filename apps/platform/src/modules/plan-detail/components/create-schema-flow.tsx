"use client";

import { useState } from "react";

import { Stack } from "@mui/material";

import { isRepetitionDirty } from "../lib/is-repetition-dirty";

import type { NodeId, RepetitionAxis, SchemaDraft } from "./axes/axis-draft.types";
import { AxisFieldSection } from "./axes/axis-field-section";
import { AxisModeButtonGrid } from "./axes/axis-mode-button-grid";
import { REPETITION_TILES } from "./axes/axis-modes";
import { ContainerInspector } from "./axes/container-inspector";
import { type LadderTrack, LadderTrackStack } from "./axes/ladder-track-stack";
import { REPETITION_DEFAULTS } from "./axes/repetition-defaults";
import { KindSwitchConfirm } from "./kind-switch-confirm";

const REPETITION_LABEL = "repetition";
const LADDER_KIND = "ladder";
const FALLBACK_KIND: RepetitionAxis["kind"] = "once";

const ladderSteps = (schema: SchemaDraft): number[] =>
  schema.repetition?.kind === LADDER_KIND ? schema.repetition.steps : [];

const ladderRepetition = (steps: number[]): RepetitionAxis => ({ kind: LADDER_KIND, steps });

const applyKind = (draft: SchemaDraft, nextKind: RepetitionAxis["kind"]): SchemaDraft => ({
  ...draft,
  repetition: REPETITION_DEFAULTS[nextKind],
});

const discardsAuthoredContent = (draft: SchemaDraft): boolean =>
  draft.repetition !== undefined && isRepetitionDirty(draft.repetition);

type CreateSchemaFlowProps = {
  draft: SchemaDraft;
  onDraftChange: (next: SchemaDraft) => void;
  onUpdateNode: (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft) => void;
  onRename: (id: NodeId, header: string) => void;
};

export const CreateSchemaFlow: React.FC<CreateSchemaFlowProps> = ({
  draft,
  onDraftChange,
  onUpdateNode,
  onRename,
}) => {
  const [pendingKind, setPendingKind] = useState<RepetitionAxis["kind"] | null>(null);

  const activeKind: RepetitionAxis["kind"] = draft.repetition?.kind ?? FALLBACK_KIND;

  const handleKind = (nextKind: RepetitionAxis["kind"]): void => {
    if (nextKind === activeKind) {
      return;
    }

    if (discardsAuthoredContent(draft)) {
      setPendingKind(nextKind);

      return;
    }

    onDraftChange(applyKind(draft, nextKind));
  };

  const handleConfirmKind = (): void => {
    if (pendingKind !== null) {
      onDraftChange(applyKind(draft, pendingKind));
    }

    setPendingKind(null);
  };

  const handleCancelKind = (): void => setPendingKind(null);

  const handleChangeTrack = (_index: number, steps: number[]): void =>
    onDraftChange({ ...draft, repetition: ladderRepetition(steps) });

  if (activeKind !== LADDER_KIND) {
    return (
      <ContainerInspector
        container={draft}
        isCreateMode
        headerEditable
        onUpdateNode={onUpdateNode}
        onRename={onRename}
        onDemoteNode={undefined}
      />
    );
  }

  const tracks: LadderTrack[] = [{ id: draft.id, steps: ladderSteps(draft) }];

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

      <LadderTrackStack tracks={tracks} onChangeTrack={handleChangeTrack} />

      <KindSwitchConfirm
        open={pendingKind !== null}
        onConfirm={handleConfirmKind}
        onCancel={handleCancelKind}
      />
    </Stack>
  );
};
