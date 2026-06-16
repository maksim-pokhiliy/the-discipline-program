"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";

import {
  type CreateLabelData,
  createLabelSchema,
  LABEL_CONSTANTS,
} from "@repo/contracts/lms/label";
import { type CreatableOption, FormModal, type PromiseModalController } from "@repo/ui";

import { useCreateLabel } from "@app/lib/hooks";

const MODAL_TITLE = "Create day label";
const SUBMIT_TEXT = "Create";
const NAME_LABEL = "Name";
const NAME_PLACEHOLDER = "e.g. Rest, Long Run";
const REST_LABEL = "Rest day";
const DAY_LEVELS = ["DAY"] as const;

type DayLabelCreateInput = z.input<typeof createLabelSchema>;

type DayLabelCreateModalProps = {
  controller: PromiseModalController<{ initialName: string }, CreatableOption>;
};

const buildDefaults = (initialName: string): DayLabelCreateInput => ({
  name: initialName,
  applicableLevels: [...DAY_LEVELS],
  notes: null,
  rest: false,
});

export const DayLabelCreateModal = ({ controller }: DayLabelCreateModalProps) => {
  const initialName = controller.arg?.initialName ?? "";
  const createLabel = useCreateLabel();
  const isSubmitting = createLabel.isPending;
  const { isOpen, cancel } = controller;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DayLabelCreateInput, unknown, CreateLabelData>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: buildDefaults(initialName),
  });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaults(initialName));
    }
  }, [isOpen, initialName, reset]);

  const onSubmit = handleSubmit((data) => {
    createLabel.mutate(data, {
      onSuccess: (label) => {
        controller.resolve({ id: label.id, label: label.name });
      },
    });
  });

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    cancel();
  };

  return (
    <FormModal
      open={isOpen}
      onClose={handleClose}
      title={MODAL_TITLE}
      maxWidth="sm"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitText={SUBMIT_TEXT}
    >
      <Stack spacing={3}>
        <TextField
          label={NAME_LABEL}
          placeholder={NAME_PLACEHOLDER}
          variant="outlined"
          fullWidth
          size="small"
          autoFocus
          disabled={isSubmitting}
          error={!!errors.name}
          helperText={errors.name?.message}
          slotProps={{ htmlInput: { maxLength: LABEL_CONSTANTS.MAX_NAME_LENGTH } }}
          {...register("name")}
        />

        <Controller
          name="rest"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value === true}
                  onChange={(_, next) => field.onChange(next)}
                  disabled={isSubmitting}
                />
              }
              label={REST_LABEL}
            />
          )}
        />
      </Stack>
    </FormModal>
  );
};
