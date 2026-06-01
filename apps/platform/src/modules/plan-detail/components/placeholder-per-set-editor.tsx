"use client";

import { Button, FormHelperText, Stack, TextField } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { PerSetSubstitution } from "@repo/contracts/lms/_shared";
import { FormSection } from "@repo/ui";

import { PerSetAssignmentRow } from "./per-set-assignment-row";
import type {
  PerSetSubstitutionAssignmentDraft,
  PerSetSubstitutionDraft,
} from "./row-payload-draft.types";

const PLACEHOLDER_NAME_LABEL = "Placeholder name";
const ASSIGNMENTS_LABEL = "Per-set assignments";
const ADD_ASSIGNMENT_LABEL = "add assignment";
const MIN_ASSIGNMENTS = 1;

type PlaceholderPerSetEditorProps = {
  value: PerSetSubstitutionDraft;
  onChange: (next: PerSetSubstitutionDraft) => void;
  error?: FieldErrors<PerSetSubstitution> | undefined;
  disabled?: boolean;
};

export const PlaceholderPerSetEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: PlaceholderPerSetEditorProps) => {
  const canRemove = value.assignments.length > MIN_ASSIGNMENTS;
  const assignmentsRootMessage = error?.assignments?.root?.message;

  const replaceAssignment = (index: number, next: PerSetSubstitutionAssignmentDraft): void => {
    onChange({
      ...value,
      assignments: value.assignments.map((assignment, i) => (i === index ? next : assignment)),
    });
  };

  const removeAssignment = (index: number): void => {
    onChange({ ...value, assignments: value.assignments.filter((_, i) => i !== index) });
  };

  const addAssignment = (): void => {
    onChange({
      ...value,
      assignments: [
        ...value.assignments,
        { setIndex: value.assignments.length + 1, exerciseId: null },
      ],
    });
  };

  return (
    <Stack spacing={2}>
      <FormSection label={PLACEHOLDER_NAME_LABEL}>
        <TextField
          fullWidth
          size="small"
          value={value.placeholderName}
          onChange={(e) => onChange({ ...value, placeholderName: e.target.value })}
          error={error?.placeholderName !== undefined}
          helperText={error?.placeholderName?.message}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label={ASSIGNMENTS_LABEL}>
        <Stack spacing={1}>
          {value.assignments.map((assignment, index) => (
            <PerSetAssignmentRow
              key={index}
              value={assignment}
              onChange={(next) => replaceAssignment(index, next)}
              onRemove={() => removeAssignment(index)}
              canRemove={canRemove}
              error={error?.assignments?.[index]}
              disabled={disabled}
            />
          ))}

          <Button size="tiny" variant="text" onClick={addAssignment} disabled={disabled}>
            {ADD_ASSIGNMENT_LABEL}
          </Button>

          {assignmentsRootMessage !== undefined && (
            <FormHelperText error>{assignmentsRootMessage}</FormHelperText>
          )}
        </Stack>
      </FormSection>
    </Stack>
  );
};
