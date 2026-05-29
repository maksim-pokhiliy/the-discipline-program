"use client";

import { Button, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { FormSection } from "@repo/ui";

import {
  type CountForm,
  COUNT_FORM_OPTIONS,
  DEFAULT_REST,
  type NRoundsParams,
  buildBranchDefaults,
  buildParams,
  toFormData,
} from "./n-rounds-form-schema";
import { NumberField } from "./number-field";
import { RestSpecFields } from "./rest-spec-fields";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

const COUNT_FIELD_WIDTH = 140;
const COUNT_FIELD_MIN = 1;
const COUNT_FIELD_STEP = 1;

export const nRoundsDefaultParams: NRoundsParams = buildParams(buildBranchDefaults("exact"));

export const toNRoundsParams = (mode: SchemaEditorMode): NRoundsParams =>
  buildParams(toFormData(mode));

export const NRoundsSchemaForm: React.FC<SchemaParamFormProps<NRoundsParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const handleCountFormChange = (_: unknown, next: CountForm | null): void => {
    if (next === null) {
      return;
    }

    const defaults = buildBranchDefaults(next);

    if ("count" in defaults && typeof value.count === "number") {
      defaults.count = value.count;
    }

    onChange(buildParams({ ...defaults, ...(value.rest && { rest: value.rest }) }));
  };

  const handleAddRest = (): void => {
    onChange({ ...value, rest: DEFAULT_REST });
  };

  const handleRemoveRest = (): void => {
    if (value.countForm === "range") {
      onChange({ countForm: "range", countRange: value.countRange });

      return;
    }

    if (value.countForm === "count_times_reps") {
      onChange({
        countForm: "count_times_reps",
        count: value.count,
        repsPerSet: value.repsPerSet,
      });

      return;
    }

    onChange({ countForm: "exact", count: value.count });
  };

  return (
    <Stack spacing={2}>
      <FormSection label="Rounds count">
        <ToggleButtonGroup
          value={value.countForm}
          exclusive
          onChange={handleCountFormChange}
          size="small"
          disabled={disabled}
        >
          {COUNT_FORM_OPTIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormSection>

      {value.countForm === "exact" && (
        <NumberField
          label="Rounds"
          value={value.count ?? NaN}
          onChange={(count) => onChange({ ...value, count })}
          min={COUNT_FIELD_MIN}
          step={COUNT_FIELD_STEP}
          error={error?.count?.message}
          disabled={disabled}
          maxWidth={COUNT_FIELD_WIDTH}
        />
      )}

      {value.countForm === "range" && (
        <Stack direction="row" spacing={1}>
          <NumberField
            label="Min rounds"
            value={value.countRange?.min ?? NaN}
            onChange={(min) =>
              onChange({
                ...value,
                countRange: { min, max: value.countRange?.max ?? min },
              })
            }
            min={COUNT_FIELD_MIN}
            step={COUNT_FIELD_STEP}
            error={error?.countRange?.min?.message}
            disabled={disabled}
            maxWidth={COUNT_FIELD_WIDTH}
          />

          <NumberField
            label="Max rounds"
            value={value.countRange?.max ?? NaN}
            onChange={(max) =>
              onChange({
                ...value,
                countRange: { min: value.countRange?.min ?? max, max },
              })
            }
            min={COUNT_FIELD_MIN}
            step={COUNT_FIELD_STEP}
            error={error?.countRange?.max?.message ?? error?.countRange?.root?.message}
            disabled={disabled}
            maxWidth={COUNT_FIELD_WIDTH}
          />
        </Stack>
      )}

      {value.countForm === "count_times_reps" && (
        <Stack direction="row" spacing={1}>
          <NumberField
            label="Rounds"
            value={value.count ?? NaN}
            onChange={(count) => onChange({ ...value, count })}
            min={COUNT_FIELD_MIN}
            step={COUNT_FIELD_STEP}
            error={error?.count?.message}
            disabled={disabled}
            maxWidth={COUNT_FIELD_WIDTH}
          />

          <NumberField
            label="Reps per set"
            value={value.repsPerSet ?? NaN}
            onChange={(repsPerSet) => onChange({ ...value, repsPerSet })}
            min={COUNT_FIELD_MIN}
            step={COUNT_FIELD_STEP}
            error={error?.repsPerSet?.message}
            disabled={disabled}
            maxWidth={COUNT_FIELD_WIDTH}
          />
        </Stack>
      )}

      <FormSection label="Rest">
        {value.rest === undefined ? (
          <Button size="tiny" variant="text" disabled={disabled} onClick={handleAddRest}>
            + add rest
          </Button>
        ) : (
          <Stack spacing={1}>
            <RestSpecFields
              value={value.rest}
              onChange={(rest) => onChange({ ...value, rest })}
              error={error?.rest}
              disabled={disabled}
            />

            <Button size="tiny" variant="text" disabled={disabled} onClick={handleRemoveRest}>
              remove rest
            </Button>
          </Stack>
        )}
      </FormSection>
    </Stack>
  );
};
