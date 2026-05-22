"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  URL_APPLIES_TO,
  type UrlAppliesTo,
  urlAppliesToSchema,
} from "@repo/contracts/lms/schema-row";
import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import type { RowEditorMode, RowFormProps } from "./row-editor-types";

export const standaloneUrlRowFormSchema = z.object({
  url: z.string().url(),
  appliesTo: urlAppliesToSchema,
});

type StandaloneUrlRowFormData = z.infer<typeof standaloneUrlRowFormSchema>;

const DEFAULT_APPLIES_TO: UrlAppliesTo = "previous_exercise_row";

const URL_APPLIES_TO_LABELS: Record<UrlAppliesTo, string> = {
  previous_exercise_row: "Previous exercise row",
  whole_schema: "Whole schema",
};

export const toFormData = (mode: RowEditorMode): StandaloneUrlRowFormData => {
  if (mode.kind === "create") {
    return { url: "", appliesTo: DEFAULT_APPLIES_TO };
  }

  if (mode.row.rowPayload.rowKind === "STANDALONE_URL") {
    return { url: mode.row.rowPayload.url, appliesTo: mode.row.rowPayload.appliesTo };
  }

  return { url: "", appliesTo: DEFAULT_APPLIES_TO };
};

export const StandaloneUrlRowForm: React.FC<RowFormProps> = ({
  mode,
  planId,
  startDate,
  onClose,
}) => {
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);

  const { control, handleSubmit, reset } = useForm<StandaloneUrlRowFormData>({
    resolver: zodResolver(standaloneUrlRowFormSchema),
    defaultValues: toFormData(mode),
  });

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const isSubmitting = createSchemaRow.isPending || updateSchemaRow.isPending;

  const onSubmit = (data: StandaloneUrlRowFormData) => {
    const rowPayload = {
      rowKind: "STANDALONE_URL",
      url: data.url,
      wrapped: true,
      appliesTo: data.appliesTo,
    } as const;

    if (mode.kind === "create") {
      createSchemaRow.mutate(
        { schemaId: mode.schemaId, rowKind: "STANDALONE_URL", rowPayload },
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
      title={mode.kind === "create" ? "Add url row" : "Edit url row"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Stack spacing={2}>
        <Controller
          name="url"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              label="URL"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error !== undefined}
              helperText={fieldState.error?.message}
              disabled={isSubmitting}
              fullWidth
            />
          )}
        />

        <Controller
          name="appliesTo"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl
              size="small"
              sx={{ minWidth: 220 }}
              disabled={isSubmitting}
              error={fieldState.error !== undefined}
            >
              <InputLabel>Applies to</InputLabel>
              <Select value={field.value} label="Applies to" onChange={field.onChange}>
                {URL_APPLIES_TO.map((option) => (
                  <MenuItem key={option} value={option}>
                    {URL_APPLIES_TO_LABELS[option]}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error !== undefined && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Stack>
    </FormModal>
  );
};
