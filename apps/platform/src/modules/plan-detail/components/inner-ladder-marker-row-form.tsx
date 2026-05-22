"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { FormModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import type { RowEditorMode, RowFormProps } from "./row-editor-types";
import { StepArrayFields } from "./step-array-fields";

export const innerLadderMarkerRowFormSchema = z.object({
  steps: z.array(z.number().int().positive()).min(1),
});

type InnerLadderMarkerRowFormData = z.infer<typeof innerLadderMarkerRowFormSchema>;

const DEFAULT_FIRST_STEP = 21;
const DEFAULT_STEPS: number[] = [DEFAULT_FIRST_STEP];

export const toFormData = (mode: RowEditorMode): InnerLadderMarkerRowFormData => {
  if (mode.kind === "create") {
    return { steps: DEFAULT_STEPS };
  }

  if (mode.row.rowPayload.rowKind === "INNER_LADDER_MARKER") {
    return { steps: mode.row.rowPayload.steps };
  }

  return { steps: DEFAULT_STEPS };
};

export const InnerLadderMarkerRowForm: React.FC<RowFormProps> = ({
  mode,
  planId,
  startDate,
  onClose,
}) => {
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);

  const { control, handleSubmit, reset, formState } = useForm<InnerLadderMarkerRowFormData>({
    resolver: zodResolver(innerLadderMarkerRowFormSchema),
    defaultValues: toFormData(mode),
  });

  useEffect(() => {
    reset(toFormData(mode));
  }, [mode, reset]);

  const isSubmitting = createSchemaRow.isPending || updateSchemaRow.isPending;

  const onSubmit = (data: InnerLadderMarkerRowFormData) => {
    const rowPayload = {
      rowKind: "INNER_LADDER_MARKER",
      steps: data.steps,
    } as const;

    if (mode.kind === "create") {
      createSchemaRow.mutate(
        { schemaId: mode.schemaId, rowKind: "INNER_LADDER_MARKER", rowPayload },
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
      title={mode.kind === "create" ? "Add ladder marker row" : "Edit ladder marker row"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText="Save"
    >
      <Controller
        name="steps"
        control={control}
        render={({ field }) => (
          <StepArrayFields
            value={field.value}
            onChange={field.onChange}
            error={formState.errors.steps}
            disabled={isSubmitting}
          />
        )}
      />
    </FormModal>
  );
};
