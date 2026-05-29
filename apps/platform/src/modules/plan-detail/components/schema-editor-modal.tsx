"use client";

import { type FormEvent, useEffect, useId, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import {
  effortPercentSchema,
  hrZoneSchema,
  numericPaceSchema,
  paceSchema,
  rpeSchema,
} from "@repo/contracts/lms/_shared";
import { type Archetype } from "@repo/contracts/lms/archetype";
import { type ArchetypeName, SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { BaseModal, FormSection } from "@repo/ui";

import { useArchetypes, useCreateSchema, useUpdateSchema } from "@app/lib/hooks";

import { intensityHasAny } from "../lib/format-block-meta";

import type { SchemaEditorMode } from "./schema-editor-types";
import {
  type ShellIntensityForm,
  buildIntensityCandidate,
  parseArchetypeParams,
} from "./schema-form-utils";
import { SchemaIntensityOverride } from "./schema-intensity-override";
import { SchemaParamFormDispatch } from "./schema-param-form-dispatch";
import { SCHEMA_PARAM_FORM_REGISTRY } from "./schema-param-form-registry";

const HEADER_PLACEHOLDER = 'e.g. "Strength" or "Conditioning"';

const shellResolverSchema = z.object({
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH),
  intensity: z.object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  }),
  params: z.unknown(),
});

export type SchemaShellFormData = z.infer<typeof shellResolverSchema>;

type SchemaEditorModalProps = {
  open: boolean;
  onClose: () => void;
  mode: SchemaEditorMode;
  planId: string;
  startDate: string;
  onBack?: () => void;
};

const resolveArchetypeName = (mode: SchemaEditorMode): ArchetypeName =>
  mode.kind === "create" ? mode.archetype.name : mode.schema.schema.archetypeParams.archetype;

const toIntensityForm = (mode: SchemaEditorMode): ShellIntensityForm => {
  if (mode.kind === "create") {
    return {};
  }

  const { intensity } = mode.schema.schema;

  return {
    ...(intensity?.effortPercent !== undefined && { effortPercent: intensity.effortPercent }),
    ...(intensity?.rpe !== undefined && { rpe: intensity.rpe }),
    ...(intensity?.pace !== undefined && { pace: intensity.pace }),
    ...(intensity?.hrZone !== undefined && { hrZone: intensity.hrZone }),
    ...(intensity?.numericPace !== undefined && { numericPace: intensity.numericPace }),
  };
};

const toShellFormData = (mode: SchemaEditorMode): SchemaShellFormData => {
  const entry = SCHEMA_PARAM_FORM_REGISTRY[resolveArchetypeName(mode)];

  if (mode.kind === "create") {
    return { header: "", intensity: {}, params: entry?.defaultParams ?? {} };
  }

  return {
    header: mode.schema.schema.header ?? "",
    intensity: toIntensityForm(mode),
    params: entry?.toParams(mode) ?? mode.schema.schema.archetypeParams.params,
  };
};

export const SchemaEditorModal: React.FC<SchemaEditorModalProps> = ({
  open,
  onClose,
  mode,
  planId,
  startDate,
  onBack,
}) => {
  const formId = useId();
  const createSchema = useCreateSchema(planId, startDate);
  const updateSchema = useUpdateSchema(planId, startDate);
  const { data: archetypes } = useArchetypes();
  const [paramsError, setParamsError] = useState<FieldErrors | undefined>(undefined);

  const { control, handleSubmit, reset, setValue } = useForm<SchemaShellFormData>({
    resolver: zodResolver(shellResolverSchema),
    defaultValues: toShellFormData(mode),
  });

  const params = useWatch({ control, name: "params" });

  useEffect(() => {
    setParamsError(undefined);
    reset(toShellFormData(mode));
  }, [mode, reset]);

  const isCreate = mode.kind === "create";
  const isPending = createSchema.isPending || updateSchema.isPending;
  const archetypeName = resolveArchetypeName(mode);
  const archetype: Archetype | undefined = archetypes?.find((a) => a.name === archetypeName);

  const onSubmit = (data: SchemaShellFormData): void => {
    const parsed = parseArchetypeParams(archetypeName, data.params);

    if (!parsed.ok) {
      setParamsError(parsed.error);

      return;
    }

    setParamsError(undefined);

    const candidate = buildIntensityCandidate(data.intensity);
    const intensity = intensityHasAny(candidate) ? candidate : null;
    const header = data.header.trim() === "" ? null : data.header.trim();

    if (mode.kind === "create") {
      createSchema.mutate(
        {
          blockId: mode.blockId,
          kind: mode.archetype.kind,
          archetypeId: mode.archetype.archetypeId,
          header,
          intensity,
          archetypeParams: parsed.value,
        },
        { onSuccess: () => onClose() },
      );

      return;
    }

    updateSchema.mutate(
      {
        schemaId: mode.schema.schema.id,
        data: { header, intensity, archetypeParams: parsed.value },
      },
      { onSuccess: () => onClose() },
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    void handleSubmit(onSubmit)(e);
  };

  if (!open) {
    return null;
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={isCreate ? "Add schema" : "Edit schema"}
      subtitle={isCreate ? "step 2 of 2" : undefined}
      maxWidth="md"
      disableBackdropClick={isPending}
      disableEscapeKeyDown={isPending}
      actions={
        <>
          {isCreate && onBack !== undefined && (
            <Button onClick={onBack} disabled={isPending} size="small">
              ← Back
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button onClick={onClose} disabled={isPending} size="small">
            Cancel
          </Button>

          <Button
            form={formId}
            type="submit"
            variant="contained"
            size="small"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? "Saving…" : isCreate ? "Create schema" : "Save"}
          </Button>
        </>
      }
    >
      <Stack component="form" id={formId} onSubmit={handleFormSubmit} spacing={3}>
        {archetype !== undefined && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <InfoOutlinedIcon fontSize="small" color="disabled" />

            <Typography variant="caption" color="text.subtle">
              {`${archetype.label} · ${archetype.kind} — ${archetype.headerPatternDescription}`}
            </Typography>
          </Stack>
        )}

        <FormSection label="Header" helper="optional">
          <Controller
            name="header"
            control={control}
            render={({ field, formState }) => (
              <TextField
                fullWidth
                size="small"
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                placeholder={HEADER_PLACEHOLDER}
                inputProps={{
                  maxLength: SCHEMA_CONSTANTS.MAX_HEADER_LENGTH,
                  "aria-label": "Schema header",
                }}
                error={formState.errors.header !== undefined}
                helperText={formState.errors.header?.message}
              />
            )}
          />
        </FormSection>

        <SchemaIntensityOverride control={control} isPending={isPending} />

        <SchemaParamFormDispatch
          archetype={archetypeName}
          value={params}
          onChange={(next) => setValue("params", next, { shouldDirty: true })}
          error={paramsError}
          disabled={isPending}
        />
      </Stack>
    </BaseModal>
  );
};
