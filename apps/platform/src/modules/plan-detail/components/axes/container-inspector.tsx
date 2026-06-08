"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { RestSpec, StagedProgramKind } from "@repo/contracts/lms/_shared";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind } from "@repo/contracts/lms/schema-row";
import { InlineEditText } from "@repo/ui";

import { collectArrangementTargets } from "../../lib/arrangement-targets";
import { shouldBeContainer } from "../../lib/should-be-container";
import { RestSpecFields, restSpecFormSchema, type RestSpecFormValue } from "../rest-spec-fields";

import { ArrangementAxisField } from "./arrangement-axis-field";
import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  NodeId,
  RepetitionAxis,
  ScoringDirective,
} from "./axis-draft.types";
import { ProgramKindAxisField } from "./program-kind-axis-field";
import { RepetitionAxisField } from "./repetition-axis-field";
import { ScoringAxisField } from "./scoring-axis-field";

const HEADER_LABEL = "Header";
const HEADER_ARIA = "Inspector header";
const HEADER_PLACEHOLDER = "group…";
const REST_LABEL = "rest";
const PANEL_SPACING = 2;
const REST_ISSUE_TYPE = "contract";
const LADDER_MARKER_ROW_KIND: RowKind = "INNER_LADDER_MARKER";
const LADDER_MARKER_CONFLICT =
  "A ladder rep-scheme group can't also hold an inner-ladder-marker row — move the marker out or change the repetition.";
const DEMOTE_HINT =
  "This group holds a single movement and no rep-scheme. A plain row may read cleaner — drop it down to a row, or give it a scheme to keep it as a group.";
const DEMOTE_BUTTON_LABEL = "Demote to row";

const DEFAULT_REPETITION: RepetitionAxis = { kind: "once" };
const DEFAULT_ARRANGEMENT: ArrangementAxis = { kind: "ordered" };
const DEFAULT_SCORING: ScoringDirective = { kind: "prescribed" };
const DEFAULT_REST: RestSpec = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

type RestDurationErrors = NonNullable<FieldErrors<RestSpecFormValue>["duration"]>;

const restErrorsFromParse = (rest: RestSpec): FieldErrors<RestSpecFormValue> | undefined => {
  const result = restSpecFormSchema.safeParse(rest);

  if (result.success) {
    return undefined;
  }

  const duration: RestDurationErrors = {};

  for (const issue of result.error.issues) {
    const [head, field] = issue.path;

    if (head !== "duration") {
      continue;
    }

    if (field === "value" && duration.value === undefined) {
      duration.value = { type: REST_ISSUE_TYPE, message: issue.message };
    } else if (field === "rangeMax" && duration.rangeMax === undefined) {
      duration.rangeMax = { type: REST_ISSUE_TYPE, message: issue.message };
    } else if (field === undefined && duration.root === undefined) {
      duration.root = { type: REST_ISSUE_TYPE, message: issue.message };
    }
  }

  return { duration };
};

type ContainerInspectorProps = {
  container: ComposeContainer;
  exerciseById: Map<string, Exercise>;
  isCreateMode: boolean;
  onUpdateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
  onRename: (id: NodeId, header: string) => void;
  onDemoteNode?: ((id: NodeId) => void) | undefined;
};

const asContainerPatch =
  (patch: (container: ComposeContainer) => ComposeContainer) =>
  (node: ComposeNode): ComposeNode =>
    node.nodeType === "container" ? patch(node) : node;

export const ContainerInspector: React.FC<ContainerInspectorProps> = ({
  container,
  exerciseById,
  isCreateMode,
  onUpdateNode,
  onRename,
  onDemoteNode,
}) => {
  const arrangementTargets = collectArrangementTargets(container, exerciseById);

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

  const setProgramKind = (next?: StagedProgramKind): void =>
    onUpdateNode(
      container.id,
      asContainerPatch(({ programKind: _previous, ...node }) => ({
        ...node,
        ...(next !== undefined && { programKind: next }),
      })),
    );

  const setRest = (rest: RestSpec): void =>
    onUpdateNode(
      container.id,
      asContainerPatch((node) => ({ ...node, rest })),
    );

  const hasInnerLadderMarker = container.children.some(
    (child) => child.nodeType === "row" && child.rowKind === LADDER_MARKER_ROW_KIND,
  );
  const isLadder = (container.repetition ?? DEFAULT_REPETITION).kind === "ladder";
  const repetitionError = isLadder && hasInnerLadderMarker ? LADDER_MARKER_CONFLICT : undefined;

  const showsDemoteHint =
    isCreateMode && !shouldBeContainer(container) && container.children.length === 1;
  const isSingleRowChild =
    container.children.length === 1 && container.children[0]?.nodeType === "row";
  const showsDemote = isCreateMode && !shouldBeContainer(container) && isSingleRowChild;

  return (
    <Stack direction="column" spacing={PANEL_SPACING}>
      {showsDemoteHint ? (
        <Alert severity="info" variant="outlined">
          <Stack direction="column" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Typography variant="body2">{DEMOTE_HINT}</Typography>

            {showsDemote && onDemoteNode !== undefined ? (
              <Button size="small" onClick={() => onDemoteNode(container.id)}>
                {DEMOTE_BUTTON_LABEL}
              </Button>
            ) : null}
          </Stack>
        </Alert>
      ) : null}

      <Stack direction="column" spacing={0.5}>
        <Typography variant="caption" color="text.subtle">
          {HEADER_LABEL}
        </Typography>

        {isCreateMode ? (
          <InlineEditText
            value={container.header ?? ""}
            onCommit={(next) => onRename(container.id, next)}
            variant="h4"
            ariaLabel={HEADER_ARIA}
            emptyIsValid
            placeholder={HEADER_PLACEHOLDER}
          />
        ) : (
          <Typography
            variant="h4"
            color={container.header === null ? "text.subtle" : "text.primary"}
            aria-label={HEADER_ARIA}
          >
            {container.header ?? HEADER_PLACEHOLDER}
          </Typography>
        )}
      </Stack>

      <RepetitionAxisField
        value={container.repetition ?? DEFAULT_REPETITION}
        onChange={setRepetition}
        error={repetitionError}
      />

      <ArrangementAxisField
        value={container.arrangement ?? DEFAULT_ARRANGEMENT}
        onChange={setArrangement}
        childContainers={arrangementTargets.childContainers}
        directRows={arrangementTargets.directRows}
        rowsByTrack={arrangementTargets.rowsByTrack}
      />

      <ScoringAxisField
        value={container.scoring ?? DEFAULT_SCORING}
        onChange={setScoring}
        disabled={!isCreateMode}
      />

      <ProgramKindAxisField value={container.programKind} onChange={setProgramKind} />

      <Stack direction="column" spacing={0.5}>
        <Typography variant="caption" color="text.subtle">
          {REST_LABEL}
        </Typography>

        <RestSpecFields
          value={container.rest ?? DEFAULT_REST}
          onChange={setRest}
          error={restErrorsFromParse(container.rest ?? DEFAULT_REST)}
        />
      </Stack>
    </Stack>
  );
};
