"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { type z } from "zod";

import {
  type CreateSchemeTemplateInput,
  createSchemeTemplateInputSchema,
  SCHEME_TEMPLATE_CONSTANTS,
  type SchemeTemplate,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormModal, SchemeForm } from "@repo/ui";

import { useCreateSchemeTemplate, useUpdateSchemeTemplate } from "@app/lib/hooks";

import { DEFAULT_PARAMS_TEMPLATES, SCHEME_ARCHETYPE_KIND_OPTIONS } from "../constants";

type SchemeTemplateFormInput = z.input<typeof createSchemeTemplateInputSchema>;

const buildDefaults = (initial?: SchemeTemplate): SchemeTemplateFormInput => ({
  scope: "COACH",
  name: initial?.name ?? "",
  description: initial?.description ?? undefined,
  archetypeKind: initial?.archetypeKind ?? "NONE",
  defaultParams: initial?.defaultParams ?? DEFAULT_PARAMS_TEMPLATES.NONE,
});

type SchemeTemplateFormModalProps = {
  open: boolean;
  initial?: SchemeTemplate | undefined;
  onClose: () => void;
};

export const SchemeTemplateFormModal = ({
  open,
  initial,
  onClose,
}: SchemeTemplateFormModalProps) => {
  const createMutation = useCreateSchemeTemplate();
  const updateMutation = useUpdateSchemeTemplate();
  const isEdit = !!initial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<SchemeTemplateFormInput, unknown, CreateSchemeTemplateInput>({
    resolver: zodResolver(createSchemeTemplateInputSchema),
    defaultValues: buildDefaults(initial),
  });

  const archetypeKind = useWatch({ control: methods.control, name: "archetypeKind" });

  useEffect(() => {
    if (open) {
      methods.reset(buildDefaults(initial));
    }
  }, [open, initial, methods]);

  useEffect(() => {
    if (!archetypeKind) {
      return;
    }

    const current = methods.getValues("defaultParams");

    if (current?.kind === archetypeKind) {
      return;
    }

    methods.setValue("defaultParams", DEFAULT_PARAMS_TEMPLATES[archetypeKind], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [archetypeKind, methods]);

  const submit = methods.handleSubmit((data) => {
    if (isEdit && initial) {
      const payload: UpdateSchemeTemplateInput = {
        name: data.name,
        description: data.description,
        archetypeKind: data.archetypeKind,
        defaultParams: data.defaultParams,
      };

      updateMutation.mutate({ id: initial.id, data: payload }, { onSuccess: () => onClose() });

      return;
    }

    createMutation.mutate(data, { onSuccess: () => onClose() });
  });

  const {
    control,
    register,
    formState: { errors },
  } = methods;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={isPending}
      title={isEdit ? "Edit scheme template" : "Create scheme template"}
      submitText={isEdit ? "Save" : "Create"}
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            placeholder="e.g. Standard EMOM 10"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.name}
            helperText={errors.name?.message}
            inputProps={{ maxLength: SCHEME_TEMPLATE_CONSTANTS.MAX_NAME_LENGTH }}
            {...register("name")}
          />

          <TextField
            label="Description"
            placeholder="What this template configures, when to use..."
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            disabled={isPending}
            error={!!errors.description}
            helperText={errors.description?.message}
            inputProps={{ maxLength: SCHEME_TEMPLATE_CONSTANTS.MAX_DESCRIPTION_LENGTH }}
            {...register("description")}
          />

          <Controller
            name="archetypeKind"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Archetype kind"
                select
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ??
                  "Switching archetypes resets default params to a starter shape"
                }
              >
                {SCHEME_ARCHETYPE_KIND_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="defaultParams"
            control={control}
            render={({ field }) => {
              if (!archetypeKind || !field.value) {
                return <></>;
              }

              return (
                <SchemeForm
                  archetypeKind={archetypeKind}
                  schemeParams={field.value}
                  onChange={(next) => field.onChange(next)}
                  disabled={isPending}
                />
              );
            }}
          />
        </Stack>
      </FormProvider>
    </FormModal>
  );
};
