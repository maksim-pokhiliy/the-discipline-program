"use client";

import { ExerciseFormFields } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

type ExerciseFormProps = {
  isLoading: boolean;
};

export const ExerciseForm = ({ isLoading }: ExerciseFormProps) => {
  return (
    <FormCard title="Exercise">
      <ExerciseFormFields isLoading={isLoading} />
    </FormCard>
  );
};
