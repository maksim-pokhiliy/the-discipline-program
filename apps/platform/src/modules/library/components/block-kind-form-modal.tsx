"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import {
  BLOCK_KIND_CONSTANTS,
  type BlockKind,
  type CreateBlockKindInput,
  createBlockKindInputSchema,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { FormModal } from "@repo/ui";

import { useCreateBlockKind, useUpdateBlockKind } from "@app/lib/hooks";

import { SCHEME_ARCHETYPE_KIND_OPTIONS } from "../constants";

type BlockKindFormInput = z.input<typeof createBlockKindInputSchema>;

const NONE_VALUE = "__none__";

const buildDefaults = (initial?: BlockKind): BlockKindFormInput => ({
  scope: "COACH",
  name: initial?.name ?? "",
  description: initial?.description ?? undefined,
  iconKey: initial?.iconKey ?? undefined,
  defaultWeight: initial?.defaultWeight ?? 1,
  defaultArchetypeKind: initial?.defaultArchetypeKind ?? undefined,
  analyticsCategory: initial?.analyticsCategory ?? undefined,
});

type BlockKindFormModalProps = {
  open: boolean;
  initial?: BlockKind;
  onClose: () => void;
};

export const BlockKindFormModal = ({ open, initial, onClose }: BlockKindFormModalProps) => {
  const createMutation = useCreateBlockKind();
  const updateMutation = useUpdateBlockKind();
  const isEdit = !!initial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<BlockKindFormInput, unknown, CreateBlockKindInput>({
    resolver: zodResolver(createBlockKindInputSchema),
    defaultValues: buildDefaults(initial),
  });

  useEffect(() => {
    if (open) {
      methods.reset(buildDefaults(initial));
    }
  }, [open, initial, methods]);

  const submit = methods.handleSubmit((data) => {
    if (isEdit && initial) {
      const payload: UpdateBlockKindInput = {
        name: data.name,
        description: data.description,
        iconKey: data.iconKey,
        defaultWeight: data.defaultWeight,
        defaultArchetypeKind: data.defaultArchetypeKind,
        analyticsCategory: data.analyticsCategory,
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
      title={isEdit ? "Edit block kind" : "Create block kind"}
      submitText={isEdit ? "Save" : "Create"}
    >
      <FormProvider {...methods}>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            placeholder="e.g. Strength"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.name}
            helperText={errors.name?.message}
            inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_NAME_LENGTH }}
            {...register("name")}
          />

          <TextField
            label="Description"
            placeholder="What this block is for, defaults, hints..."
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            disabled={isPending}
            error={!!errors.description}
            helperText={errors.description?.message}
            inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_DESCRIPTION_LENGTH }}
            {...register("description")}
          />

          <TextField
            label="Icon key"
            placeholder="e.g. flame, dumbbell, timer"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.iconKey}
            helperText={errors.iconKey?.message}
            inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_ICON_KEY_LENGTH }}
            {...register("iconKey")}
          />

          <Controller
            name="defaultWeight"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label="Default weight"
                type="number"
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ??
                  `Range ${BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT}–${BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT}, controls ordering`
                }
                inputProps={{
                  min: BLOCK_KIND_CONSTANTS.MIN_DEFAULT_WEIGHT,
                  max: BLOCK_KIND_CONSTANTS.MAX_DEFAULT_WEIGHT,
                  step: 1,
                }}
                value={field.value ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;

                  field.onChange(raw === "" ? undefined : Number(raw));
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
              />
            )}
          />

          <Controller
            name="defaultArchetypeKind"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label="Default archetype"
                select
                variant="outlined"
                fullWidth
                disabled={isPending}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ?? "Default scheme archetype for new segments"
                }
                value={field.value ?? NONE_VALUE}
                onChange={(event) => {
                  const next = event.target.value;

                  field.onChange(next === NONE_VALUE ? undefined : next);
                }}
                onBlur={field.onBlur}
                name={field.name}
              >
                <MenuItem value={NONE_VALUE}>Not set</MenuItem>
                {SCHEME_ARCHETYPE_KIND_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Analytics category"
            placeholder="e.g. strength, conditioning"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.analyticsCategory}
            helperText={errors.analyticsCategory?.message}
            inputProps={{ maxLength: BLOCK_KIND_CONSTANTS.MAX_ANALYTICS_CATEGORY_LENGTH }}
            {...register("analyticsCategory")}
          />
        </Stack>
      </FormProvider>
    </FormModal>
  );
};
