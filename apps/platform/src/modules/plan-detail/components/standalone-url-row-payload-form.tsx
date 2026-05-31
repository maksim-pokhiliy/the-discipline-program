"use client";

import { Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { URL_APPLIES_TO, type UrlAppliesTo } from "@repo/contracts/lms/schema-row";
import { FormSection } from "@repo/ui";

import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";

type StandaloneUrlRowFormValue = { url: string; wrapped: boolean; appliesTo: UrlAppliesTo };

const DEFAULT_APPLIES_TO: UrlAppliesTo = "previous_exercise_row";

const URL_APPLIES_TO_LABELS: Record<UrlAppliesTo, string> = {
  previous_exercise_row: "Previous exercise row",
  whole_schema: "Whole schema",
};

const WRAPPED_VALUE = "wrapped";
const BARE_VALUE = "bare";

const WRAPPED_LABEL = "Wrapped <…>";
const BARE_LABEL = "Bare";

const NOTATION_HELPER = "non-semantic — preserves original source format";

export const standaloneUrlDefaultValue: StandaloneUrlRowFormValue = {
  url: "",
  wrapped: true,
  appliesTo: DEFAULT_APPLIES_TO,
};

export const toStandaloneUrlValue = (mode: RowEditorMode): StandaloneUrlRowFormValue => {
  if (mode.kind === "create") {
    return standaloneUrlDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "STANDALONE_URL") {
    return {
      url: mode.row.rowPayload.url,
      wrapped: mode.row.rowPayload.wrapped,
      appliesTo: mode.row.rowPayload.appliesTo,
    };
  }

  return standaloneUrlDefaultValue;
};

export const StandaloneUrlRowPayloadForm: React.FC<
  RowPayloadFormProps<StandaloneUrlRowFormValue>
> = ({ value, onChange, error, disabled = false }) => {
  const handleAppliesToChange = (_: unknown, next: UrlAppliesTo | null): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, appliesTo: next });
  };

  const handleWrappedChange = (_: unknown, next: string | null): void => {
    if (next === null) {
      return;
    }

    onChange({ ...value, wrapped: next === WRAPPED_VALUE });
  };

  return (
    <Stack spacing={2}>
      <FormSection label="URL">
        <TextField
          type="url"
          fullWidth
          size="small"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          error={error?.url !== undefined}
          helperText={error?.url?.message}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label="Applies to">
        <ToggleButtonGroup
          aria-label="applies to"
          value={value.appliesTo}
          exclusive
          size="small"
          onChange={handleAppliesToChange}
          disabled={disabled}
        >
          {URL_APPLIES_TO.map((option) => (
            <ToggleButton key={option} value={option}>
              {URL_APPLIES_TO_LABELS[option]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormSection>

      <FormSection label="Notation" helper={NOTATION_HELPER}>
        <ToggleButtonGroup
          aria-label="notation"
          value={value.wrapped ? WRAPPED_VALUE : BARE_VALUE}
          exclusive
          size="small"
          onChange={handleWrappedChange}
          disabled={disabled}
        >
          <ToggleButton value={WRAPPED_VALUE}>{WRAPPED_LABEL}</ToggleButton>
          <ToggleButton value={BARE_VALUE}>{BARE_LABEL}</ToggleButton>
        </ToggleButtonGroup>
      </FormSection>
    </Stack>
  );
};
