"use client";

import { Button, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { Load, SandwichCompound, TempoModifier } from "@repo/contracts/lms/_shared";
import { FormSection } from "@repo/ui";

import type { SandwichCompoundElementDraft, SandwichFormDraft } from "./exercise-form-draft.types";
import { ExerciseRefField } from "./exercise-ref-field";
import { LoadEditor } from "./load-editor";
import { RepNotationEditor } from "./rep-notation-editor";
import { normalizeSharedModifiers } from "./shared-modifiers-utils";
import { TempoEditor } from "./tempo-editor";
import { buildDefaultLoad } from "./weight-load-defaults";

const SANDWICH_SLOTS = ["opening", "middle", "closing"] as const;

type SandwichSlot = (typeof SANDWICH_SLOTS)[number];

const SLOT_EXERCISE_LABEL = "exercise";
const ADD_LOAD_LABEL = "add load";
const REMOVE_LOAD_LABEL = "remove";
const DEFAULT_LOAD_KIND = "absolute";
const SHARED_LOAD_HELPER = "one load applied across every slot";

type SandwichFormEditorProps = {
  value: SandwichFormDraft;
  onChange: (next: SandwichFormDraft) => void;
  error?: FieldErrors<SandwichCompound> | undefined;
  disabled?: boolean;
};

export const SandwichFormEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: SandwichFormEditorProps) => {
  const sharedLoad = value.sharedModifiers?.load;
  const sharedTempo = value.sharedModifiers?.tempo;

  const updateSlot = (slot: SandwichSlot, nextElement: SandwichCompoundElementDraft): void => {
    onChange({ ...value, [slot]: nextElement });
  };

  const removeSlotLoad = (slot: SandwichSlot, element: SandwichCompoundElementDraft): void => {
    updateSlot(slot, { exerciseId: element.exerciseId, reps: element.reps });
  };

  const applySharedModifiers = (load: Load | undefined, tempo: TempoModifier | undefined): void => {
    const sharedModifiers = normalizeSharedModifiers({ load, tempo });

    if (sharedModifiers === undefined) {
      onChange({ opening: value.opening, middle: value.middle, closing: value.closing });

      return;
    }

    onChange({ ...value, sharedModifiers });
  };

  const renderSlot = (slot: SandwichSlot): React.ReactNode => {
    const element = value[slot];
    const slotError = error?.[slot];
    const slotLoad = element.load;

    return (
      <FormSection key={slot} label={slot}>
        <Stack spacing={1.5}>
          <ExerciseRefField
            label={SLOT_EXERCISE_LABEL}
            value={element.exerciseId}
            onChange={(id) => updateSlot(slot, { ...element, exerciseId: id })}
            error={slotError?.exerciseId !== undefined}
            disabled={disabled}
          />

          <FormSection label="reps">
            <RepNotationEditor
              value={element.reps}
              onChange={(reps) => updateSlot(slot, { ...element, reps })}
              error={slotError?.reps}
              disabled={disabled}
            />
          </FormSection>

          <FormSection label="load (optional)">
            {slotLoad === undefined ? (
              <Button
                size="tiny"
                variant="text"
                onClick={() =>
                  updateSlot(slot, { ...element, load: buildDefaultLoad(DEFAULT_LOAD_KIND) })
                }
                disabled={disabled}
              >
                {ADD_LOAD_LABEL}
              </Button>
            ) : (
              <Stack spacing={1}>
                <LoadEditor
                  value={slotLoad}
                  onChange={(load) => updateSlot(slot, { ...element, load })}
                  error={slotError?.load}
                  disabled={disabled}
                />

                <Button
                  size="tiny"
                  variant="text"
                  onClick={() => removeSlotLoad(slot, element)}
                  disabled={disabled}
                >
                  {REMOVE_LOAD_LABEL}
                </Button>
              </Stack>
            )}
          </FormSection>
        </Stack>
      </FormSection>
    );
  };

  return (
    <Stack spacing={2}>
      {SANDWICH_SLOTS.map(renderSlot)}

      <FormSection label="shared modifiers">
        <Stack spacing={1.5}>
          <FormSection label="load (optional)" helper={SHARED_LOAD_HELPER}>
            {sharedLoad === undefined ? (
              <Button
                size="tiny"
                variant="text"
                onClick={() =>
                  applySharedModifiers(buildDefaultLoad(DEFAULT_LOAD_KIND), sharedTempo)
                }
                disabled={disabled}
              >
                {ADD_LOAD_LABEL}
              </Button>
            ) : (
              <Stack spacing={1}>
                <LoadEditor
                  value={sharedLoad}
                  onChange={(load) => applySharedModifiers(load, sharedTempo)}
                  error={error?.sharedModifiers?.load}
                  disabled={disabled}
                />

                <Button
                  size="tiny"
                  variant="text"
                  onClick={() => applySharedModifiers(undefined, sharedTempo)}
                  disabled={disabled}
                >
                  {REMOVE_LOAD_LABEL}
                </Button>
              </Stack>
            )}
          </FormSection>

          <FormSection label="tempo (optional)">
            <TempoEditor
              value={sharedTempo ?? null}
              onChange={(tempo) => applySharedModifiers(sharedLoad, tempo ?? undefined)}
              error={error?.sharedModifiers?.tempo}
              disabled={disabled}
            />
          </FormSection>
        </Stack>
      </FormSection>
    </Stack>
  );
};
