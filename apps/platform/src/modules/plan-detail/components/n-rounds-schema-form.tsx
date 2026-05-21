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
  type ControllerRenderProps,
  Controller,
  type FieldPath,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";

import type {
  ArchetypeParams,
  CreateSchemaRequest,
  UpdateSchemaRequest,
} from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import { RestSpecFields, restSpecFormSchema, type RestSpecFormValue } from "./rest-spec-fields";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type NRoundsParams = Extract<ArchetypeParams, { archetype: "n-rounds" }>["params"];

const DEFAULT_COUNT = 5;
const DEFAULT_RANGE_MIN = 3;
const DEFAULT_RANGE_MAX = 5;
const DEFAULT_REPS_PER_SET = 8;
const DEFAULT_REST_VALUE = 90;

const positiveInt = z.number().int().positive();

const nRoundsFormSchema = z.discriminatedUnion("countForm", [
  z.object({
    countForm: z.literal("exact"),
    count: positiveInt,
    rest: restSpecFormSchema.optional(),
  }),
  z.object({
    countForm: z.literal("range"),
    countRange: z
      .object({ min: positiveInt, max: positiveInt })
      .refine((r) => r.min < r.max, { message: "min must be less than max" }),
    rest: restSpecFormSchema.optional(),
  }),
  z.object({
    countForm: z.literal("count_times_reps"),
    count: positiveInt,
    repsPerSet: positiveInt,
    rest: restSpecFormSchema.optional(),
  }),
]);

type NRoundsFormData = z.infer<typeof nRoundsFormSchema>;
type CountForm = NRoundsFormData["countForm"];

const COUNT_FORM_OPTIONS: { value: CountForm; label: string }[] = [
  { value: "exact", label: "Exact" },
  { value: "range", label: "Range" },
  { value: "count_times_reps", label: "Count × reps" },
];

const DEFAULT_REST: RestSpecFormValue = {
  duration: { value: DEFAULT_REST_VALUE, unit: "sec" },
  scope: "between_rounds",
};

const buildBranchDefaults = (countForm: CountForm): NRoundsFormData => {
  if (countForm === "exact") {
    return { countForm: "exact", count: DEFAULT_COUNT };
  }

  if (countForm === "range") {
    return {
      countForm: "range",
      countRange: { min: DEFAULT_RANGE_MIN, max: DEFAULT_RANGE_MAX },
    };
  }

  return { countForm: "count_times_reps", count: DEFAULT_COUNT, repsPerSet: DEFAULT_REPS_PER_SET };
};

const toFormData = (mode: SchemaEditorMode): NRoundsFormData => {
  if (mode.kind === "create") {
    return buildBranchDefaults("exact");
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype !== "n-rounds") {
    return buildBranchDefaults("exact");
  }

  const { params } = archetypeParams;
  const rest = params.rest;

  if (params.countForm === "range" && params.countRange !== undefined) {
    return { countForm: "range", countRange: params.countRange, ...(rest && { rest }) };
  }

  if (params.countForm === "count_times_reps" && params.repsPerSet !== undefined) {
    return {
      countForm: "count_times_reps",
      count: params.count ?? DEFAULT_COUNT,
      repsPerSet: params.repsPerSet,
      ...(rest && { rest }),
    };
  }

  return { countForm: "exact", count: params.count ?? DEFAULT_COUNT, ...(rest && { rest }) };
};

const buildParams = (data: NRoundsFormData): NRoundsParams => {
  if (data.countForm === "exact") {
    return { countForm: "exact", count: data.count, ...(data.rest && { rest: data.rest }) };
  }

  if (data.countForm === "range") {
    return {
      countForm: "range",
      countRange: data.countRange,
      ...(data.rest && { rest: data.rest }),
    };
  }

  return {
    countForm: "count_times_reps",
    count: data.count,
    repsPerSet: data.repsPerSet,
    ...(data.rest && { rest: data.rest }),
  };
};

const numberFieldProps = (
  label: string,
  field: ControllerRenderProps<NRoundsFormData, FieldPath<NRoundsFormData>>,
  disabled: boolean,
): TextFieldProps => ({
  label,
  type: "number",
  size: "small",
  value: typeof field.value === "number" ? field.value : "",
  onChange: (e) => field.onChange(Number(e.target.value)),
  inputProps: { min: 1, step: 1 },
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

  const { control, handleSubmit, reset, setValue, getValues } = useForm<NRoundsFormData>({
    resolver: zodResolver(nRoundsFormSchema),
    defaultValues: toFormData(mode),
  });

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

    const current = getValues("rest");

    reset({ ...buildBranchDefaults(next), ...(current && { rest: current }) });
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
            render={({ field }) => (
              <TextField {...numberFieldProps("Rounds", field, isSubmitting)} />
            )}
          />
        )}

        {countForm === "range" && (
          <Stack direction="row" spacing={1}>
            <Controller
              name="countRange.min"
              control={control}
              render={({ field }) => (
                <TextField {...numberFieldProps("Min rounds", field, isSubmitting)} />
              )}
            />
            <Controller
              name="countRange.max"
              control={control}
              render={({ field }) => (
                <TextField {...numberFieldProps("Max rounds", field, isSubmitting)} />
              )}
            />
          </Stack>
        )}

        {countForm === "count_times_reps" && (
          <Stack direction="row" spacing={1}>
            <Controller
              name="count"
              control={control}
              render={({ field }) => (
                <TextField {...numberFieldProps("Rounds", field, isSubmitting)} />
              )}
            />
            <Controller
              name="repsPerSet"
              control={control}
              render={({ field }) => (
                <TextField {...numberFieldProps("Reps per set", field, isSubmitting)} />
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
