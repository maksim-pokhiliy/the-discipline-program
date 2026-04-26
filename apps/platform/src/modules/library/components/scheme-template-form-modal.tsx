"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { type z } from "zod";

import {
  schemeParamsSchema,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "@repo/contracts/lms/_domain";
import {
  type CreateSchemeTemplateInput,
  createSchemeTemplateInputSchema,
  SCHEME_TEMPLATE_CONSTANTS,
  type SchemeTemplate,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { FormModal } from "@repo/ui";

import { useCreateSchemeTemplate, useUpdateSchemeTemplate } from "@app/lib/hooks";

import { DEFAULT_PARAMS_TEMPLATES, SCHEME_ARCHETYPE_KIND_OPTIONS } from "../constants";

type SchemeTemplateFormInput = z.input<typeof createSchemeTemplateInputSchema>;

const stringifyParams = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
};

const validateDefaultParams = (
  raw: string,
  archetypeKind: SchemeArchetypeKind | undefined,
): { ok: true; value: SchemeParams } | { ok: false; message: string } => {
  if (raw.trim().length === 0) {
    return { ok: false, message: "Default params required" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      message: `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    };
  }

  const result = schemeParamsSchema.safeParse(parsed);

  if (!result.success) {
    return { ok: false, message: result.error.issues.map((i) => i.message).join("; ") };
  }

  if (archetypeKind && result.data.kind !== archetypeKind) {
    return {
      ok: false,
      message: `Params 'kind' must equal selected archetype (${archetypeKind})`,
    };
  }

  return { ok: true, value: result.data };
};

const initialParams = (initial?: SchemeTemplate): SchemeParams => {
  if (!initial) {
    return { kind: "NONE" };
  }

  const parsed = schemeParamsSchema.safeParse(initial.defaultParams);

  return parsed.success ? parsed.data : { kind: "NONE" };
};

const buildDefaults = (initial?: SchemeTemplate): SchemeTemplateFormInput => ({
  scope: "COACH",
  name: initial?.name ?? "",
  description: initial?.description ?? undefined,
  archetypeKind: initial?.archetypeKind ?? "NONE",
  defaultParams: initialParams(initial),
});

type SchemeTemplateFormModalProps = {
  open: boolean;
  initial?: SchemeTemplate;
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
  const [paramsText, setParamsText] = useState(() =>
    stringifyParams(methods.getValues("defaultParams")),
  );

  useEffect(() => {
    if (open) {
      const defaults = buildDefaults(initial);

      methods.reset(defaults);
      setParamsText(stringifyParams(defaults.defaultParams));
    }
  }, [open, initial, methods]);

  useEffect(() => {
    if (!archetypeKind) {
      return;
    }

    const current = methods.getValues("defaultParams");

    if (current.kind === archetypeKind) {
      return;
    }

    const template = DEFAULT_PARAMS_TEMPLATES[archetypeKind];

    if (template) {
      const parsed = schemeParamsSchema.safeParse(template);

      if (parsed.success) {
        methods.setValue("defaultParams", parsed.data, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setParamsText(stringifyParams(parsed.data));
      }
    }
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
            render={({ fieldState }) => {
              const result = validateDefaultParams(paramsText, archetypeKind);
              const errorMessage = !result.ok ? result.message : undefined;

              return (
                <Stack spacing={1}>
                  <TextField
                    label="Default params (JSON)"
                    multiline
                    minRows={8}
                    fullWidth
                    variant="outlined"
                    disabled={isPending}
                    error={!!fieldState.error || Boolean(errorMessage)}
                    value={paramsText}
                    onChange={(event) => {
                      const next = event.target.value;

                      setParamsText(next);

                      const validation = validateDefaultParams(next, archetypeKind);

                      if (validation.ok) {
                        methods.setValue("defaultParams", validation.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                    inputProps={{ "aria-label": "Default params JSON" }}
                  />

                  <Typography
                    variant="caption"
                    color={errorMessage ? "error" : "text.secondary"}
                    sx={{ fontFamily: "monospace" }}
                  >
                    {errorMessage ?? "Validated against schemeParamsSchema before save"}
                  </Typography>
                </Stack>
              );
            }}
          />
        </Stack>
      </FormProvider>
    </FormModal>
  );
};
