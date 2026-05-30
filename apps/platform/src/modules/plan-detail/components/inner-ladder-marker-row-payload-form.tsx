"use client";

import { FormSection } from "@repo/ui";

import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import { StepArrayFields } from "./step-array-fields";

type InnerLadderMarkerRowFormValue = { steps: number[] };

const DEFAULT_FIRST_STEP = 21;

export const innerLadderMarkerDefaultValue: InnerLadderMarkerRowFormValue = {
  steps: [DEFAULT_FIRST_STEP],
};

export const toInnerLadderMarkerValue = (mode: RowEditorMode): InnerLadderMarkerRowFormValue => {
  if (mode.kind === "create") {
    return innerLadderMarkerDefaultValue;
  }

  if (mode.row.rowPayload.rowKind === "INNER_LADDER_MARKER") {
    return { steps: mode.row.rowPayload.steps };
  }

  return innerLadderMarkerDefaultValue;
};

export const InnerLadderMarkerRowPayloadForm: React.FC<
  RowPayloadFormProps<InnerLadderMarkerRowFormValue>
> = ({ value, onChange, error, disabled = false }) => (
  <FormSection label="Steps">
    <StepArrayFields
      value={value.steps}
      onChange={(steps) => onChange({ steps })}
      error={error?.steps}
      disabled={disabled}
    />
  </FormSection>
);
