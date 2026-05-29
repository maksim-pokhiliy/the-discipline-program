"use client";

import { Button, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";

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
import { RestSpecFields } from "./rest-spec-fields";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

const COUNT_FIELD_WIDTH = 140;

export const nRoundsDefaultParams: NRoundsParams = buildParams(buildBranchDefaults("exact"));

export const toNRoundsParams = (mode: SchemaEditorMode): NRoundsParams =>
  buildParams(toFormData(mode));

const toNumber = (raw: string): number => Number(raw);

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
        <TextField
          label="Rounds"
          type="number"
          size="small"
          value={value.count ?? ""}
          onChange={(e) => onChange({ ...value, count: toNumber(e.target.value) })}
          inputProps={{ min: 1, step: 1 }}
          error={error?.count?.message !== undefined}
          helperText={error?.count?.message}
          disabled={disabled}
          sx={{ maxWidth: COUNT_FIELD_WIDTH }}
        />
      )}

      {value.countForm === "range" && (
        <Stack direction="row" spacing={1}>
          <TextField
            label="Min rounds"
            type="number"
            size="small"
            value={value.countRange?.min ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                countRange: {
                  min: toNumber(e.target.value),
                  max: value.countRange?.max ?? toNumber(e.target.value),
                },
              })
            }
            inputProps={{ min: 1, step: 1 }}
            error={error?.countRange?.min?.message !== undefined}
            helperText={error?.countRange?.min?.message}
            disabled={disabled}
            sx={{ maxWidth: COUNT_FIELD_WIDTH }}
          />

          <TextField
            label="Max rounds"
            type="number"
            size="small"
            value={value.countRange?.max ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                countRange: {
                  min: value.countRange?.min ?? toNumber(e.target.value),
                  max: toNumber(e.target.value),
                },
              })
            }
            inputProps={{ min: 1, step: 1 }}
            error={
              error?.countRange?.max?.message !== undefined ||
              error?.countRange?.root?.message !== undefined
            }
            helperText={error?.countRange?.max?.message ?? error?.countRange?.root?.message}
            disabled={disabled}
            sx={{ maxWidth: COUNT_FIELD_WIDTH }}
          />
        </Stack>
      )}

      {value.countForm === "count_times_reps" && (
        <Stack direction="row" spacing={1}>
          <TextField
            label="Rounds"
            type="number"
            size="small"
            value={value.count ?? ""}
            onChange={(e) => onChange({ ...value, count: toNumber(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={error?.count?.message !== undefined}
            helperText={error?.count?.message}
            disabled={disabled}
            sx={{ maxWidth: COUNT_FIELD_WIDTH }}
          />

          <TextField
            label="Reps per set"
            type="number"
            size="small"
            value={value.repsPerSet ?? ""}
            onChange={(e) => onChange({ ...value, repsPerSet: toNumber(e.target.value) })}
            inputProps={{ min: 1, step: 1 }}
            error={error?.repsPerSet?.message !== undefined}
            helperText={error?.repsPerSet?.message}
            disabled={disabled}
            sx={{ maxWidth: COUNT_FIELD_WIDTH }}
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
