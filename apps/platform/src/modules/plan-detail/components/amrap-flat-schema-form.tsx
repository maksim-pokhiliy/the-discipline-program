"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { CreateSchemaRequest, UpdateSchemaRequest } from "@repo/contracts/lms/schema";
import { FormModal } from "@repo/ui";

import { useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

const DEFAULT_DURATION_MIN = 10;

const amrapFlatFormSchema = z.object({
  durationMin: z.number().int().positive(),
});

type AmrapFlatFormData = z.infer<typeof amrapFlatFormSchema>;

const toFormData = (mode: SchemaEditorMode): AmrapFlatFormData => {
  if (mode.kind === "create") {
    return { durationMin: DEFAULT_DURATION_MIN };
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "amrap-flat") {
    return { durationMin: archetypeParams.params.durationMin };
  }

  return { durationMin: DEFAULT_DURATION_MIN };
};

export const AmrapFlatSchemaForm: React.FC<SchemaParamFormProps> = ({
  mode,
  planId,
  startDate,
  onClose,
}) => {
  const createSchema = useCreateSchema(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);

  const { control, handleSubmit, reset } = useForm<AmrapFlatFormData>({
    resolver: zodResolver(amrapFlatFormSchema),
    defaultValues: toFormData(mode),
  });

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const isSubmitting = createSchema.isPending || updateSchema.isPending;

  const onSubmit = (data: AmrapFlatFormData) => {
    const archetypeParams: CreateSchemaRequest["archetypeParams"] = {
      archetype: "amrap-flat",
      params: { durationMin: data.durationMin },
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
      title={mode.kind === "create" ? "Add AMRAP" : "Edit AMRAP"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Stack spacing={2}>
        <Controller
          name="durationMin"
          control={control}
          render={({ field }) => (
            <TextField
              label="Duration (minutes)"
              type="number"
              size="small"
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              inputProps={{ min: 1, step: 1 }}
              disabled={isSubmitting}
              sx={{ maxWidth: 200 }}
            />
          )}
        />
      </Stack>
    </FormModal>
  );
};
