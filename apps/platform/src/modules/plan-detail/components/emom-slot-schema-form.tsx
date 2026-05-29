"use client";

import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { FieldError } from "react-hook-form";

import { SLOT_SPEC_KINDS, type SlotSpec, type SlotSpecKind } from "@repo/contracts/lms/_shared";
import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";
import { StepArrayFields } from "./step-array-fields";

type EmomSlotParams = ParamsFor<"emom-sub-minute-slot">;

const SINGLE_DEFAULT: SlotSpec = { kind: "single", minute: 1 };
const GROUPED_DEFAULT: SlotSpec = { kind: "grouped", minutes: [1, 3, 5] };

const MINUTE_FIELD_MIN = 1;
const MINUTE_FIELD_STEP = 1;
const MINUTE_FIELD_WIDTH = 160;

const SLOT_KIND_LABELS: Record<SlotSpecKind, string> = {
  single: "Single minute",
  grouped: "Grouped minutes",
};

const VALIDATION_ERROR_TYPE = "validation";

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null;

const readMessage = (node: unknown): string | undefined => {
  if (isRecord(node) && typeof node.message === "string") {
    return node.message;
  }

  if (isRecord(node) && isRecord(node.root) && typeof node.root.message === "string") {
    return node.root.message;
  }

  return undefined;
};

const readMinuteError = (slotError: unknown): string | undefined => {
  if (isRecord(slotError)) {
    return readMessage(slotError.minute);
  }

  return undefined;
};

const readMinutesError = (slotError: unknown): FieldError | undefined => {
  if (!isRecord(slotError)) {
    return undefined;
  }

  const message = readMessage(slotError.minutes);

  return message === undefined ? undefined : { type: VALIDATION_ERROR_TYPE, message };
};

export const emomSlotDefaultParams: EmomSlotParams = { slot: SINGLE_DEFAULT };

export const toEmomSlotParams = (mode: SchemaEditorMode): EmomSlotParams => {
  if (mode.kind === "create") {
    return emomSlotDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "emom-sub-minute-slot") {
    return { slot: archetypeParams.params.slot };
  }

  return emomSlotDefaultParams;
};

export const EmomSlotForm: React.FC<SchemaParamFormProps<EmomSlotParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const { slot } = value;

  const handleKindChange = (_: unknown, next: SlotSpecKind | null): void => {
    if (next === null) {
      return;
    }

    onChange({ slot: next === "single" ? SINGLE_DEFAULT : GROUPED_DEFAULT });
  };

  const slotError = error?.slot;

  return (
    <FormSection label="EMOM slot" helper="which minute(s) within the round this fires">
      <Stack spacing={1.5}>
        <ToggleButtonGroup
          value={slot.kind}
          exclusive
          onChange={handleKindChange}
          size="small"
          disabled={disabled}
        >
          {SLOT_SPEC_KINDS.map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {SLOT_KIND_LABELS[kind]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {slot.kind === "single" ? (
          <NumberField
            label="Minute"
            value={slot.minute}
            onChange={(minute) => onChange({ slot: { kind: "single", minute } })}
            min={MINUTE_FIELD_MIN}
            step={MINUTE_FIELD_STEP}
            error={readMinuteError(slotError)}
            disabled={disabled}
            maxWidth={MINUTE_FIELD_WIDTH}
          />
        ) : (
          <Stack spacing={0.5}>
            <StepArrayFields
              value={slot.minutes}
              onChange={(minutes) => onChange({ slot: { kind: "grouped", minutes } })}
              error={readMinutesError(slotError)}
              disabled={disabled}
            />

            <Typography variant="caption" color="text.subtle">
              ≥2 minutes
            </Typography>
          </Stack>
        )}
      </Stack>
    </FormSection>
  );
};
