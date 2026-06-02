"use client";

import { Stack, Typography } from "@mui/material";

import type { RestSpec } from "@repo/contracts/lms/_shared";
import { InlineEditText } from "@repo/ui";

import { RestSpecFields } from "../../components/rest-spec-fields";
import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  NodeId,
  RepetitionAxis,
  ScoringDirective,
} from "../compose-tree.types";

import { ArrangementAxisField } from "./axes/arrangement-axis-field";
import { RepetitionAxisField } from "./axes/repetition-axis-field";
import { ScoringAxisField } from "./axes/scoring-axis-field";

const HEADER_LABEL = "Header";
const HEADER_ARIA = "Inspector header";
const HEADER_PLACEHOLDER = "group…";
const REST_LABEL = "rest";
const PANEL_SPACING = 2;

const DEFAULT_REPETITION: RepetitionAxis = { kind: "once" };
const DEFAULT_ARRANGEMENT: ArrangementAxis = { kind: "ordered" };
const DEFAULT_SCORING: ScoringDirective = { kind: "prescribed" };
const DEFAULT_REST: RestSpec = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

type ComposeContainerInspectorProps = {
  container: ComposeContainer;
  onUpdateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
  onRename: (id: NodeId, header: string) => void;
};

const asContainerPatch =
  (patch: (container: ComposeContainer) => ComposeContainer) =>
  (node: ComposeNode): ComposeNode =>
    node.nodeType === "container" ? patch(node) : node;

export const ComposeContainerInspector: React.FC<ComposeContainerInspectorProps> = ({
  container,
  onUpdateNode,
  onRename,
}) => {
  const setRepetition = (repetition: RepetitionAxis): void =>
    onUpdateNode(
      container.id,
      asContainerPatch((node) => ({ ...node, repetition })),
    );

  const setArrangement = (arrangement: ArrangementAxis): void =>
    onUpdateNode(
      container.id,
      asContainerPatch((node) => ({ ...node, arrangement })),
    );

  const setScoring = (scoring: ScoringDirective): void =>
    onUpdateNode(
      container.id,
      asContainerPatch((node) => ({ ...node, scoring })),
    );

  const setRest = (rest: RestSpec): void =>
    onUpdateNode(
      container.id,
      asContainerPatch((node) => ({ ...node, rest })),
    );

  return (
    <Stack direction="column" spacing={PANEL_SPACING}>
      <Stack direction="column" spacing={0.5}>
        <Typography variant="caption" color="text.subtle">
          {HEADER_LABEL}
        </Typography>

        <InlineEditText
          value={container.header ?? ""}
          onCommit={(next) => onRename(container.id, next)}
          variant="h4"
          ariaLabel={HEADER_ARIA}
          emptyIsValid
          placeholder={HEADER_PLACEHOLDER}
        />
      </Stack>

      <RepetitionAxisField
        value={container.repetition ?? DEFAULT_REPETITION}
        onChange={setRepetition}
      />

      <ArrangementAxisField
        value={container.arrangement ?? DEFAULT_ARRANGEMENT}
        onChange={setArrangement}
      />

      <ScoringAxisField value={container.scoring ?? DEFAULT_SCORING} onChange={setScoring} />

      <Stack direction="column" spacing={0.5}>
        <Typography variant="caption" color="text.subtle">
          {REST_LABEL}
        </Typography>

        <RestSpecFields value={container.rest ?? DEFAULT_REST} onChange={setRest} />
      </Stack>
    </Stack>
  );
};
