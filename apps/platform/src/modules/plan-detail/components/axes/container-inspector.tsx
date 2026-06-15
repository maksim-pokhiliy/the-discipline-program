"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Intensity, RestSpec } from "@repo/contracts/lms/_shared";
import { SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { InlineEditText } from "@repo/ui";

import { shouldBeContainer } from "../../lib/should-be-container";
import { IntensityFields } from "../intensity-fields";
import { RestSpecFields, restSpecFormSchema, type RestSpecFormValue } from "../rest-spec-fields";

import type { NodeId, RepetitionAxis, SchemaDraft } from "./axis-draft.types";
import { AxisFieldSection } from "./axis-field-section";
import { RepetitionAxisField } from "./repetition-axis-field";

const HEADER_LABEL = "Schema title (optional)";
const HEADER_ARIA = "Inspector header";
const HEADER_PLACEHOLDER = "name this container…";
const REST_LABEL = "rest";
const REST_ADD_LABEL = "Add rest";
const REST_REMOVE_LABEL = "Remove rest";
const INTENSITY_LABEL = "intensity";
const PANEL_SPACING = 2;
const REST_ISSUE_TYPE = "contract";
const DEMOTE_HINT =
  "This group holds a single movement and no rep-scheme. A plain row may read cleaner — drop it down to a row, or give it a scheme to keep it as a group.";
const DEMOTE_BUTTON_LABEL = "Demote to row";

const DEFAULT_REPETITION: RepetitionAxis = { kind: "once" };
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
  container: SchemaDraft;
  isCreateMode: boolean;
  headerEditable?: boolean;
  onUpdateNode: (id: NodeId, patch: (schema: SchemaDraft) => SchemaDraft) => void;
  onRename: (id: NodeId, header: string) => void;
  onDemoteNode?: ((id: NodeId) => void) | undefined;
};

export const ContainerInspector: React.FC<ContainerInspectorProps> = ({
  container,
  isCreateMode,
  headerEditable = isCreateMode,
  onUpdateNode,
  onRename,
  onDemoteNode,
}) => {
  const setRepetition = (repetition: RepetitionAxis): void =>
    onUpdateNode(container.id, (schema) => ({ ...schema, repetition }));

  const setRest = (rest: RestSpec): void =>
    onUpdateNode(container.id, (schema) => ({ ...schema, rest }));

  const clearRest = (): void =>
    onUpdateNode(container.id, (schema) => {
      const next = { ...schema };

      delete next.rest;

      return next;
    });

  const setIntensity = (intensity: Intensity | null): void =>
    onUpdateNode(container.id, (schema) => ({ ...schema, intensity }));

  const hasSingleRow = container.rows.length === 1;
  const showsDemoteHint = isCreateMode && !shouldBeContainer(container) && hasSingleRow;
  const showsDemote = showsDemoteHint;

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

      <RepetitionAxisField
        value={container.repetition ?? DEFAULT_REPETITION}
        onChange={setRepetition}
      />

      <AxisFieldSection label={REST_LABEL}>
        {container.rest !== undefined ? (
          <Stack direction="column" spacing={1} sx={{ alignItems: "flex-start" }}>
            <RestSpecFields
              value={container.rest}
              onChange={setRest}
              error={restErrorsFromParse(container.rest)}
            />

            <Button size="small" color="inherit" onClick={clearRest}>
              {REST_REMOVE_LABEL}
            </Button>
          </Stack>
        ) : (
          <Button size="small" onClick={() => setRest(DEFAULT_REST)}>
            {REST_ADD_LABEL}
          </Button>
        )}
      </AxisFieldSection>

      <AxisFieldSection label={INTENSITY_LABEL}>
        <IntensityFields value={container.intensity ?? null} onChange={setIntensity} />
      </AxisFieldSection>

      <Stack direction="column" spacing={0.5}>
        <Typography variant="caption" color="text.subtle">
          {HEADER_LABEL}
        </Typography>

        {headerEditable ? (
          <InlineEditText
            value={container.header ?? ""}
            onCommit={(next) => onRename(container.id, next)}
            variant="h4"
            ariaLabel={HEADER_ARIA}
            emptyIsValid
            maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
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
    </Stack>
  );
};
