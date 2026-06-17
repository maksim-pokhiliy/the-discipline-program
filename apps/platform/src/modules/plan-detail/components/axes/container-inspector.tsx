"use client";

import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

import {
  type Intensity,
  type ResultType,
  RESULT_TYPES,
  type RestSpec,
  type TimeCap,
} from "@repo/contracts/lms/_shared";
import { type Benchmark } from "@repo/contracts/lms/composition";
import { SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { InlineEditText } from "@repo/ui";

import {
  capErrorsFromParse,
  DEFAULT_REST,
  restErrorsFromParse,
} from "../../lib/field-error-bridge";
import { shouldBeContainer } from "../../lib/should-be-container";
import { IntensityFields } from "../intensity-fields";
import { RestSpecFields } from "../rest-spec-fields";
import { TimeCapFields } from "../time-cap-fields";

import type { NodeId, RepetitionAxis, SchemaDraft } from "./axis-draft.types";
import { AxisFieldSection } from "./axis-field-section";
import { RepetitionAxisField } from "./repetition-axis-field";
import { DEFAULT_TIME_CAP } from "./repetition-defaults";

const HEADER_LABEL = "Schema title (optional)";
const HEADER_ARIA = "Inspector header";
const HEADER_PLACEHOLDER = "name this container…";
const REST_LABEL = "rest";
const REST_ADD_LABEL = "Add rest";
const REST_REMOVE_LABEL = "Remove rest";
const INTENSITY_LABEL = "intensity";
const CAP_LABEL = "cap";
const CAP_ADD_LABEL = "Add cap";
const CAP_REMOVE_LABEL = "Remove cap";
const BENCHMARK_LABEL = "benchmark";
const BENCHMARK_ADD_LABEL = "Add benchmark";
const BENCHMARK_REMOVE_LABEL = "Remove benchmark";
const RESULT_TYPE_FIELD_LABEL = "Result type";
const DEFAULT_RESULT_TYPE: ResultType = "time";
const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  time: "Time",
  rounds_reps: "Rounds + reps",
  load: "Load",
  max_reps: "Max reps",
  distance: "Distance",
  calories: "Calories",
};
const PANEL_SPACING = 2;

const isResultType = (value: string): value is ResultType =>
  RESULT_TYPES.some((resultType) => resultType === value);
const DEMOTE_HINT =
  "This group holds a single movement and no rep-scheme. A plain row may read cleaner — drop it down to a row, or give it a scheme to keep it as a group.";
const DEMOTE_BUTTON_LABEL = "Demote to row";

const DEFAULT_REPETITION: RepetitionAxis = { kind: "once" };

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

  const setCap = (cap: TimeCap | null): void =>
    onUpdateNode(container.id, (schema) => ({ ...schema, cap }));

  const clearCap = (): void =>
    onUpdateNode(container.id, (schema) => {
      const next = { ...schema };

      delete next.cap;

      return next;
    });

  const setBenchmark = (benchmark: Benchmark | null): void =>
    onUpdateNode(container.id, (schema) => ({ ...schema, benchmark }));

  const handleResultTypeChange = (value: string): void => {
    if (isResultType(value)) {
      setBenchmark({ resultType: value });
    }
  };

  const clearBenchmark = (): void =>
    onUpdateNode(container.id, (schema) => {
      const next = { ...schema };

      delete next.benchmark;

      return next;
    });

  const hasSingleRow = container.rows.length === 1;
  const showsDemoteHint = isCreateMode && !shouldBeContainer(container) && hasSingleRow;
  const showsDemote = showsDemoteHint;
  const showsCapSection = container.repetition?.kind !== "timeCap";

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

      {showsCapSection ? (
        <AxisFieldSection label={CAP_LABEL}>
          {container.cap != null ? (
            <Stack direction="column" spacing={1} sx={{ alignItems: "flex-start" }}>
              <TimeCapFields
                value={container.cap}
                onChange={setCap}
                error={capErrorsFromParse(container.cap)}
              />

              <Button size="small" color="inherit" onClick={clearCap}>
                {CAP_REMOVE_LABEL}
              </Button>
            </Stack>
          ) : (
            <Button size="small" onClick={() => setCap(DEFAULT_TIME_CAP)}>
              {CAP_ADD_LABEL}
            </Button>
          )}
        </AxisFieldSection>
      ) : null}

      <AxisFieldSection label={BENCHMARK_LABEL}>
        {container.benchmark != null ? (
          <Stack direction="column" spacing={1} sx={{ alignItems: "flex-start" }}>
            <TextField
              select
              size="small"
              label={RESULT_TYPE_FIELD_LABEL}
              value={container.benchmark.resultType}
              onChange={(event) => handleResultTypeChange(event.target.value)}
            >
              {RESULT_TYPES.map((resultType) => (
                <MenuItem key={resultType} value={resultType}>
                  {RESULT_TYPE_LABELS[resultType]}
                </MenuItem>
              ))}
            </TextField>

            <Button size="small" color="inherit" onClick={clearBenchmark}>
              {BENCHMARK_REMOVE_LABEL}
            </Button>
          </Stack>
        ) : (
          <Button size="small" onClick={() => setBenchmark({ resultType: DEFAULT_RESULT_TYPE })}>
            {BENCHMARK_ADD_LABEL}
          </Button>
        )}
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
