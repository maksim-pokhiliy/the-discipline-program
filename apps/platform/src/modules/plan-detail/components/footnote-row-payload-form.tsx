"use client";

import { FormHelperText, Stack, TextField, ToggleButton } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import {
  type CompoundRow,
  FOOTNOTE_TARGETS,
  type FootnoteTarget,
} from "@repo/contracts/lms/_shared";
import {
  FOOTNOTE_MARKERS,
  type FootnoteMarker,
  SCHEMA_ROW_CONSTANTS,
} from "@repo/contracts/lms/schema-row";
import { FormSection, LabeledToggleGroup } from "@repo/ui";

import { CompoundFormEditor } from "./compound-form-editor";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import type { FootnoteRowFormValue } from "./row-payload-draft.types";

const EACH_TYPED_ROUND: FootnoteTarget = "each_typed_round";
const DEFAULT_MARKER: FootnoteMarker = "*";
const DEFAULT_TARGET: FootnoteTarget = "each_set";
const CONTENT_MIN_ELEMENTS = 0;

const MARKER_LABEL = "marker";
const TARGET_LABEL = "target";
const TYPE_LABEL_LABEL = "Type label";
const CONTENT_LABEL = "Content";
const CONTENT_HELPER = "optional · can be empty";
const NOTES_LABEL = "Notes";

const MARKER_LABELS: Record<FootnoteMarker, string> = {
  "*": "*",
  "**": "**",
};

const TARGET_LABELS: Record<FootnoteTarget, string> = {
  each_round: "Each round",
  each_set: "Each set",
  each_typed_round: "Each typed round",
};

export const footnoteDefaultValue: FootnoteRowFormValue = {
  marker: DEFAULT_MARKER,
  target: DEFAULT_TARGET,
  content: { elements: [] },
  notes: "",
};

export const toFootnoteValue = (mode: RowEditorMode): FootnoteRowFormValue => {
  if (mode.kind === "create") {
    return footnoteDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "FOOTNOTE") {
    const { marker, target, content, typeLabel } = mode.row.rowPayload;

    return {
      marker,
      target,
      content,
      notes: mode.row.notes ?? "",
      ...(typeLabel !== undefined && { typeLabel }),
    };
  }

  return footnoteDefaultValue;
};

export const FootnoteRowPayloadForm: React.FC<RowPayloadFormProps<FootnoteRowFormValue>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const contentError: FieldErrors<CompoundRow> | undefined = error?.content;
  const isTypedTarget = value.target === EACH_TYPED_ROUND;

  const handleMarkerChange = (_: unknown, next: FootnoteMarker | null): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, marker: next });
  };

  const handleTargetChange = (_: unknown, next: FootnoteTarget | null): void => {
    if (next === null) {
      return;
    }

    onChange({
      marker: value.marker,
      target: next,
      content: value.content,
      notes: value.notes,
      ...(next === EACH_TYPED_ROUND &&
        value.typeLabel !== undefined && { typeLabel: value.typeLabel }),
    });
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <LabeledToggleGroup
          label={MARKER_LABEL}
          value={value.marker}
          onChange={handleMarkerChange}
          disabled={disabled}
        >
          {FOOTNOTE_MARKERS.map((marker) => (
            <ToggleButton key={marker} value={marker}>
              {MARKER_LABELS[marker]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        {error?.marker?.message !== undefined && (
          <FormHelperText error>{error.marker.message}</FormHelperText>
        )}
      </Stack>

      <Stack spacing={0.5}>
        <LabeledToggleGroup
          label={TARGET_LABEL}
          value={value.target}
          onChange={handleTargetChange}
          disabled={disabled}
        >
          {FOOTNOTE_TARGETS.map((target) => (
            <ToggleButton key={target} value={target}>
              {TARGET_LABELS[target]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        {error?.target?.message !== undefined && (
          <FormHelperText error>{error.target.message}</FormHelperText>
        )}
      </Stack>

      {isTypedTarget && (
        <FormSection label={TYPE_LABEL_LABEL}>
          <TextField
            fullWidth
            size="small"
            value={value.typeLabel ?? ""}
            onChange={(e) => onChange({ ...value, typeLabel: e.target.value })}
            error={error?.typeLabel !== undefined}
            helperText={error?.typeLabel?.message}
            disabled={disabled}
          />
        </FormSection>
      )}

      <FormSection label={CONTENT_LABEL} helper={CONTENT_HELPER}>
        <CompoundFormEditor
          value={value.content}
          onChange={(content) => onChange({ ...value, content })}
          error={contentError}
          minElements={CONTENT_MIN_ELEMENTS}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label={NOTES_LABEL}>
        <TextField
          fullWidth
          multiline
          size="small"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          inputProps={{ maxLength: SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH }}
          disabled={disabled}
        />
      </FormSection>
    </Stack>
  );
};
