"use client";

import { type FormEvent, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  effortPercentSchema,
  hrZoneSchema,
  type Intensity,
  numericPaceSchema,
  paceSchema,
  rpeSchema,
  type TimeCap,
  timeCapSchema,
} from "@repo/contracts/lms/_shared";
import type { Block } from "@repo/contracts/lms/block";
import { FormModal } from "@repo/ui";

import { useUpdateBlock } from "@app/lib/hooks";

import { EffortPercentField } from "./effort-percent-field";
import { HrZoneField } from "./hr-zone-field";
import { NumericPaceField } from "./numeric-pace-field";
import { PaceField } from "./pace-field";
import { RpeField } from "./rpe-field";
import { TimeCapFields } from "./time-cap-fields";

const blockEditorFormSchema = z.object({
  intensity: z.object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  }),
  timeCap: timeCapSchema.nullable(),
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
});

const buildIntensityPayload = (form: BlockEditorFormData["intensity"]): Intensity | null => {
  const hasAny =
    form.effortPercent !== undefined ||
    form.rpe !== undefined ||
    form.pace !== undefined ||
    form.hrZone !== undefined ||
    form.numericPace !== undefined;

  if (!hasAny) {
    return null;
  }

  return {
    ...(form.effortPercent !== undefined && { effortPercent: form.effortPercent }),
    ...(form.rpe !== undefined && { rpe: form.rpe }),
    ...(form.pace !== undefined && { pace: form.pace }),
    ...(form.hrZone !== undefined && { hrZone: form.hrZone }),
    ...(form.numericPace !== undefined && { numericPace: form.numericPace }),
  };
};

const buildTimeCapPayload = (form: BlockEditorFormData["timeCap"]): TimeCap | null => form;

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

  const { control, handleSubmit, reset } = useForm<BlockEditorFormData>({
    resolver: zodResolver(blockEditorFormSchema),
    defaultValues: toFormData(block),
  });

  useEffect(() => {
    reset(toFormData(block));
  }, [block, reset]);

  const onSubmit = (data: BlockEditorFormData) => {
    const intensity = buildIntensityPayload(data.intensity);
    const timeCap = buildTimeCapPayload(data.timeCap);

    updateBlock.mutate(
      { blockId: block.id, data: { intensity, timeCap } },
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
      title="Edit block details"
      onSubmit={handleFormSubmit}
      isSubmitting={updateBlock.isPending}
      submitText="Save"
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Intensity (set any combination)
        </Typography>

        <Controller
          name="intensity.effortPercent"
          control={control}
          render={({ field }) => (
            <EffortPercentField
              value={field.value}
              onChange={field.onChange}
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
              disabled={updateBlock.isPending}
            />
          )}
        />

        <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
          Time cap
        </Typography>

        <Controller
          name="timeCap"
          control={control}
          render={({ field }) => (
            <TimeCapFields
              value={field.value}
              onChange={field.onChange}
              disabled={updateBlock.isPending}
            />
          )}
        />
      </Stack>
    </FormModal>
  );
};
