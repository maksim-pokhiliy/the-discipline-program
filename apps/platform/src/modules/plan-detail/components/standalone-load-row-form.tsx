"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { loadSchema } from "@repo/contracts/lms/_shared";
import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import { LoadEditor } from "./load-editor";
import type { RowEditorMode, RowFormProps } from "./row-editor-types";
import { buildDefaultLoad } from "./weight-load-defaults";

export const standaloneLoadRowFormSchema = z
  .object({ load: loadSchema })
  .superRefine((data, ctx) => {
    if (
      data.load.kind === "percentage" &&
      data.load.rangeMax !== undefined &&
      data.load.rangeMax <= data.load.value
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["load", "rangeMax"],
        message: "Max % must be greater than the value",
      });
    }
  });

type StandaloneLoadFormData = z.infer<typeof standaloneLoadRowFormSchema>;

export const toFormData = (mode: RowEditorMode): StandaloneLoadFormData => {
  if (mode.kind === "create") {
    return { load: buildDefaultLoad("absolute") };
  }

  if (mode.row.rowPayload.rowKind === "STANDALONE_LOAD") {
    return { load: mode.row.rowPayload.load };
  }

  return { load: buildDefaultLoad("absolute") };
};

export const StandaloneLoadRowForm: React.FC<RowFormProps> = ({
  mode,
  planId,
  startDate,
  onClose,
}) => {
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);

  const { control, handleSubmit, reset, formState } = useForm<StandaloneLoadFormData>({
    resolver: zodResolver(standaloneLoadRowFormSchema),
    defaultValues: toFormData(mode),
  });

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const isSubmitting = createSchemaRow.isPending || updateSchemaRow.isPending;

  const onSubmit = (data: StandaloneLoadFormData) => {
    const rowPayload = {
      rowKind: "STANDALONE_LOAD",
      load: data.load,
      scope: "applies_to_all_preceding_rows",
    } as const;

    if (mode.kind === "create") {
      createSchemaRow.mutate(
        { schemaId: mode.schemaId, rowKind: "STANDALONE_LOAD", rowPayload },
        { onSuccess: () => onClose() },
      );

      return;
    }

    updateSchemaRow.mutate(
      { schemaRowId: mode.row.id, data: { rowPayload } },
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
      title={mode.kind === "create" ? "Add load row" : "Edit load row"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Stack spacing={1.5}>
        <Controller
          name="load"
          control={control}
          render={({ field }) => (
            <LoadEditor
              value={field.value}
              onChange={field.onChange}
              error={formState.errors.load}
              disabled={isSubmitting}
            />
          )}
        />

        <Typography variant="caption" color="text.secondary">
          Applies to all preceding rows
        </Typography>
      </Stack>
    </FormModal>
  );
};
