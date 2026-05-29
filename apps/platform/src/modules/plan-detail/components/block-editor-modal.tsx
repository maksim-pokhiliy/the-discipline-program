"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  effortPercentSchema,
  hrZoneSchema,
  type Intensity,
  numericPaceSchema,
  paceSchema,
  rpeSchema,
  timeCapSchema,
} from "@repo/contracts/lms/_shared";
import { type Block, BLOCK_CONSTANTS } from "@repo/contracts/lms/block";
import { FormModal, FormSection } from "@repo/ui";

import { useUpdateBlock } from "@app/lib/hooks";

import { intensityHasAny } from "../lib/format-block-meta";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";
import { TimeCapFields } from "./time-cap-fields";

const NOTES_PLACEHOLDER = 'e.g. "Build to a heavy 5. Slow ascent, no missed reps."';
const NOTES_MIN_ROWS = 3;

const blockEditorFormSchema = z.object({
  intensity: z.object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  }),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH),
});

type BlockEditorFormData = z.infer<typeof blockEditorFormSchema>;

const toFormData = (block: Block): BlockEditorFormData => ({
  intensity: {
    ...(block.intensity?.effortPercent !== undefined && {
      effortPercent: block.intensity.effortPercent,
    }),
    ...(block.intensity?.rpe !== undefined && { rpe: block.intensity.rpe }),
    ...(block.intensity?.pace !== undefined && { pace: block.intensity.pace }),
    ...(block.intensity?.hrZone !== undefined && { hrZone: block.intensity.hrZone }),
    ...(block.intensity?.numericPace !== undefined && {
      numericPace: block.intensity.numericPace,
    }),
  },
  timeCap: block.timeCap,
  notes: block.notes ?? "",
});

const buildIntensityCandidate = (form: BlockEditorFormData["intensity"]): Intensity => ({
  ...(form.effortPercent !== undefined && { effortPercent: form.effortPercent }),
  ...(form.rpe !== undefined && { rpe: form.rpe }),
  ...(form.pace !== undefined && { pace: form.pace }),
  ...(form.hrZone !== undefined && { hrZone: form.hrZone }),
  ...(form.numericPace !== undefined && { numericPace: form.numericPace }),
});

type BlockEditorModalProps = {
  open: boolean;
  onClose: () => void;
  block: Block;
  planId: string;
  startDate: string;
};

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  open,
  onClose,
  block,
  planId,
  startDate,
}) => {
  const updateBlock = useUpdateBlock(planId, startDate);

  const { control, handleSubmit, reset, formState } = useForm<BlockEditorFormData>({
    resolver: zodResolver(blockEditorFormSchema),
    defaultValues: toFormData(block),
  });

  useEffect(() => {
    reset(toFormData(block));
  }, [block, reset]);

  const onSubmit = (data: BlockEditorFormData) => {
    const candidate = buildIntensityCandidate(data.intensity);
    const intensity = intensityHasAny(candidate) ? candidate : null;
    const notes = data.notes.trim() === "" ? null : data.notes;

    updateBlock.mutate(
      { blockId: block.id, data: { intensity, timeCap: data.timeCap, notes } },
      { onSuccess: () => onClose() },
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(e);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Edit block"
      subtitle="intensity + cap cascade to all schemas in this block"
      maxWidth="sm"
      onSubmit={handleFormSubmit}
      isSubmitting={updateBlock.isPending}
      submitText="Save"
    >
      <FormSection label="Intensity — any combination of axes">
        <Stack spacing={0.75}>
          <Controller
            name="intensity.effortPercent"
            control={control}
            render={({ field }) => (
              <EffortPercentField
                value={field.value}
                onChange={field.onChange}
                error={formState.errors.intensity?.effortPercent}
                disabled={updateBlock.isPending}
              />
            )}
          />

          <Controller
            name="intensity.rpe"
            control={control}
            render={({ field }) => (
              <RpeField
                value={field.value}
                onChange={field.onChange}
                disabled={updateBlock.isPending}
              />
            )}
          />

          <Controller
            name="intensity.pace"
            control={control}
            render={({ field }) => (
              <PaceField
                value={field.value}
                onChange={field.onChange}
                disabled={updateBlock.isPending}
              />
            )}
          />

          <Controller
            name="intensity.hrZone"
            control={control}
            render={({ field }) => (
              <HrZoneField
                value={field.value}
                onChange={field.onChange}
                disabled={updateBlock.isPending}
              />
            )}
          />

          <Controller
            name="intensity.numericPace"
            control={control}
            render={({ field }) => (
              <NumericPaceField
                value={field.value}
                onChange={field.onChange}
                error={formState.errors.intensity?.numericPace}
                disabled={updateBlock.isPending}
              />
            )}
          />
        </Stack>
      </FormSection>

      <FormSection label="Time cap">
        <Controller
          name="timeCap"
          control={control}
          render={({ field }) => (
            <TimeCapFields
              value={field.value}
              onChange={field.onChange}
              error={formState.errors.timeCap}
              disabled={updateBlock.isPending}
            />
          )}
        />
      </FormSection>

      <FormSection label="Block notes" helper="coaching cues, intent">
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField
              multiline
              minRows={NOTES_MIN_ROWS}
              fullWidth
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
              placeholder={NOTES_PLACEHOLDER}
              inputProps={{
                maxLength: BLOCK_CONSTANTS.MAX_NOTES_LENGTH,
                "aria-label": "Block notes",
              }}
              error={formState.errors.notes !== undefined}
              helperText={formState.errors.notes?.message}
            />
          )}
        />
      </FormSection>
    </FormModal>
  );
};
