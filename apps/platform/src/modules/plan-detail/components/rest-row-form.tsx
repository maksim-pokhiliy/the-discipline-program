"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import { formatRestRaw } from "./format-rest-raw";
import { RestSpecFields, restSpecFormSchema, type RestSpecFormValue } from "./rest-spec-fields";
import type { RowEditorMode, RowFormProps } from "./row-editor-types";

export const restRowFormSchema = z.object({ parsed: restSpecFormSchema });

type RestRowFormData = z.infer<typeof restRowFormSchema>;

const DEFAULT_REST_PARSED: RestSpecFormValue = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

export const toFormData = (mode: RowEditorMode): RestRowFormData => {
  if (mode.kind === "create") {
    return { parsed: DEFAULT_REST_PARSED };
  }

  if (mode.row.rowPayload.rowKind === "REST") {
    return { parsed: mode.row.rowPayload.parsed };
  }

  return { parsed: DEFAULT_REST_PARSED };
};

export const RestRowForm: React.FC<RowFormProps> = ({ mode, planId, startDate, onClose }) => {
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);

  const { control, handleSubmit, reset, formState } = useForm<RestRowFormData>({
    resolver: zodResolver(restRowFormSchema),
    defaultValues: toFormData(mode),
  });

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const isSubmitting = createSchemaRow.isPending || updateSchemaRow.isPending;

  const onSubmit = (data: RestRowFormData) => {
    const rowPayload = {
      rowKind: "REST",
      parsed: data.parsed,
      raw: formatRestRaw(data.parsed),
    } as const;

    if (mode.kind === "create") {
      createSchemaRow.mutate(
        { schemaId: mode.schemaId, rowKind: "REST", rowPayload },
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
      title={mode.kind === "create" ? "Add rest row" : "Edit rest row"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Controller
        name="parsed"
        control={control}
        render={({ field }) => (
          <RestSpecFields
            value={field.value}
            onChange={field.onChange}
            error={formState.errors.parsed}
            disabled={isSubmitting}
          />
        )}
      />
    </FormModal>
  );
};
