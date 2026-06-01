"use client";

import { Button, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { CompoundRowElement } from "@repo/contracts/lms/_shared";
import { FormSection } from "@repo/ui";

import type { CompoundRowElementDraft } from "./exercise-form-draft.types";
import { ExerciseRefField } from "./exercise-ref-field";
import { LoadEditor } from "./load-editor";
import { RepNotationEditor } from "./rep-notation-editor";
import { SideEditor } from "./side-editor";
import { buildDefaultLoad } from "./weight-load-defaults";

const ELEMENT_LABEL_PREFIX = "element";
const ADD_LOAD_LABEL = "add load";
const REMOVE_LOAD_LABEL = "remove";
const DEFAULT_LOAD_KIND = "absolute";

type CompoundElementCardProps = {
  value: CompoundRowElementDraft;
  onChange: (next: CompoundRowElementDraft) => void;
  error?: FieldErrors<CompoundRowElement> | undefined;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
};

export const CompoundElementCard = ({
  value,
  onChange,
  error,
  index,
  onRemove,
  canRemove,
  disabled = false,
}: CompoundElementCardProps) => {
  const removeLoad = (): void => {
    onChange({
      exerciseId: value.exerciseId,
      reps: value.reps,
      ...(value.side !== undefined && { side: value.side }),
    });
  };

  const removeSide = (): void => {
    onChange({
      exerciseId: value.exerciseId,
      reps: value.reps,
      ...(value.load !== undefined && { load: value.load }),
    });
  };

  return (
    <Stack spacing={1.5}>
      <ExerciseRefField
        label={`${ELEMENT_LABEL_PREFIX} ${index + 1}`}
        value={value.exerciseId}
        onChange={(id) => onChange({ ...value, exerciseId: id })}
        error={error?.exerciseId !== undefined}
        disabled={disabled}
        onRemove={onRemove}
        canRemove={canRemove}
      />

      <FormSection label="reps">
        <RepNotationEditor
          value={value.reps}
          onChange={(reps) => onChange({ ...value, reps })}
          error={error?.reps}
          disabled={disabled}
        />
      </FormSection>

      <FormSection label="load (optional)">
        {value.load === undefined ? (
          <Button
            size="tiny"
            variant="text"
            onClick={() => onChange({ ...value, load: buildDefaultLoad(DEFAULT_LOAD_KIND) })}
            disabled={disabled}
          >
            {ADD_LOAD_LABEL}
          </Button>
        ) : (
          <Stack spacing={1}>
            <LoadEditor
              value={value.load}
              onChange={(load) => onChange({ ...value, load })}
              error={error?.load}
              disabled={disabled}
            />

            <Button size="tiny" variant="text" onClick={removeLoad} disabled={disabled}>
              {REMOVE_LOAD_LABEL}
            </Button>
          </Stack>
        )}
      </FormSection>

      <FormSection label="side (optional)">
        <SideEditor
          value={value.side ?? null}
          onChange={(side) => (side === null ? removeSide() : onChange({ ...value, side }))}
          error={error?.side}
          disabled={disabled}
        />
      </FormSection>
    </Stack>
  );
};
