"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  type TextFieldProps,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  Controller,
  type FieldPath,
  useForm,
  useWatch,
} from "react-hook-form";

import type { CreateSchemaRequest, UpdateSchemaRequest } from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import {
  type CountForm,
  COUNT_FORM_OPTIONS,
  DEFAULT_REST,
  type NRoundsFormData,
  buildBranchDefaults,
  buildParams,
  nRoundsFormSchema,
  toFormData,
} from "./n-rounds-form-schema";
import { RestSpecFields } from "./rest-spec-fields";
import type { SchemaParamFormProps } from "./schema-editor-types";

const numberFieldProps = (
  label: string,
  field: ControllerRenderProps<NRoundsFormData, FieldPath<NRoundsFormData>>,
  fieldState: ControllerFieldState,
  disabled: boolean,
): TextFieldProps => ({
  label,
  type: "number",
  size: "small",
  value: typeof field.value === "number" ? field.value : "",
  onChange: (e) => field.onChange(Number(e.target.value)),
  inputProps: { min: 1, step: 1 },
  error: fieldState.error !== undefined,
  helperText: fieldState.error?.message,
  disabled,
  sx: { maxWidth: 140 },
});

export const NRoundsSchemaForm: React.FC<SchemaParamFormProps> = ({
  mode,
  planId,
  startDate,
  onClose,
}) => {
  const createSchema = useCreateSchema(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);

  const { control, handleSubmit, reset, setValue, getValues, formState } = useForm<NRoundsFormData>(
    {
      resolver: zodResolver(nRoundsFormSchema),
      defaultValues: toFormData(mode),
    },
  );

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const countForm = useWatch({ control, name: "countForm" });
  const rest = useWatch({ control, name: "rest" });
  const isSubmitting = createSchema.isPending || updateSchema.isPending;

  const handleCountFormChange = (_: unknown, next: CountForm | null) => {
    if (next === null) {
      return;
    }

    const currentRest = getValues("rest");
    const defaults = buildBranchDefaults(next);

    if ("count" in defaults) {
      const currentCount = getValues("count");

      if (typeof currentCount === "number") {
        defaults.count = currentCount;
      }
    }

    reset({ ...defaults, ...(currentRest && { rest: currentRest }) });
  };

  const handleRestToggle = (_: unknown, next: boolean) => {
    setValue("rest", next ? DEFAULT_REST : undefined);
  };

  const onSubmit = (data: NRoundsFormData) => {
    const archetypeParams: CreateSchemaRequest["archetypeParams"] = {
      archetype: "n-rounds",
      params: buildParams(data),
    };

    if (mode.kind === "create") {
      const request: CreateSchemaRequest = {
        blockId: mode.blockId,
        kind: mode.archetype.kind,
        archetypeId: mode.archetype.archetypeId,
        archetypeParams,
      };

      createSchema.mutate(request, { onSuccess: () => onClose() });

      return;
    }

    const request: UpdateSchemaRequest = { archetypeParams };

    updateSchema.mutate(
      { schemaId: mode.schema.schema.id, data: request },
      { onSuccess: () => onClose() },
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={mode.kind === "create" ? "Add rounds" : "Edit rounds"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Rounds count
          </Typography>

          <ToggleButtonGroup
            value={countForm}
            exclusive
            onChange={handleCountFormChange}
            size="small"
            disabled={isSubmitting}
          >
            {COUNT_FORM_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {countForm === "exact" && (
          <Controller
            name="count"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...numberFieldProps("Rounds", field, fieldState, isSubmitting)} />
            )}
          />
        )}

        {countForm === "range" && (
          <Stack direction="row" spacing={1}>
            <Controller
              name="countRange.min"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...numberFieldProps("Min rounds", field, fieldState, isSubmitting)} />
              )}
            />
            <Controller
              name="countRange.max"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...numberFieldProps("Max rounds", field, fieldState, isSubmitting)} />
              )}
            />
          </Stack>
        )}

        {countForm === "count_times_reps" && (
          <Stack direction="row" spacing={1}>
            <Controller
              name="count"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...numberFieldProps("Rounds", field, fieldState, isSubmitting)} />
              )}
            />
            <Controller
              name="repsPerSet"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...numberFieldProps("Reps per set", field, fieldState, isSubmitting)} />
              )}
            />
          </Stack>
        )}

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={rest !== undefined}
                onChange={handleRestToggle}
                disabled={isSubmitting}
              />
            }
            label="Add rest interval"
          />

          {rest !== undefined && (
            <Box sx={{ pl: 4, pt: 1 }}>
              <Controller
                name="rest"
                control={control}
                render={({ field }) => (
                  <RestSpecFields
                    value={field.value ?? DEFAULT_REST}
                    onChange={field.onChange}
                    error={formState.errors.rest}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Box>
          )}
        </Box>
      </Stack>
    </FormModal>
  );
};
