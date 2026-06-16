"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { createExerciseSchema, type CreateExerciseData } from "@repo/contracts/lms/exercise";
import {
  type CreatableOption,
  ExerciseFormFields,
  FormModal,
  type PromiseModalController,
} from "@repo/ui";

import { useCreateExercise } from "@app/lib/hooks";

const MODAL_TITLE = "Create exercise";
const SUBMIT_TEXT = "Create";

type ExerciseCreateInput = z.input<typeof createExerciseSchema>;

type ExerciseCreateModalProps = {
  controller: PromiseModalController<{ initialName: string }, CreatableOption>;
};

const buildDefaults = (initialName: string): ExerciseCreateInput => ({
  canonicalName: initialName,
  nature: "CONCRETE",
  defaultDemoUrls: [],
  aliases: [],
  notes: null,
});

export const ExerciseCreateModal = ({ controller }: ExerciseCreateModalProps) => {
  const initialName = controller.arg?.initialName ?? "";
  const createExercise = useCreateExercise();

  const methods = useForm<ExerciseCreateInput, unknown, CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: buildDefaults(initialName),
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    reset(buildDefaults(initialName));
  }, [initialName, reset]);

  const onSubmit = handleSubmit((data) => {
    createExercise.mutate(data, {
      onSuccess: (exercise) => {
        controller.resolve({ id: exercise.id, label: exercise.canonicalName });
      },
    });
  });

  return (
    <FormModal
      open={controller.isOpen}
      onClose={controller.cancel}
      title={MODAL_TITLE}
      maxWidth="sm"
      onSubmit={onSubmit}
      isSubmitting={createExercise.isPending}
      submitText={SUBMIT_TEXT}
    >
      <FormProvider {...methods}>
        <ExerciseFormFields isLoading={createExercise.isPending} />
      </FormProvider>
    </FormModal>
  );
};
