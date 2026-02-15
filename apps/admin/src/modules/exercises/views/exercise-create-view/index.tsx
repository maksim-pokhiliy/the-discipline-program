"use client";

import { useCallback } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { type CreateExerciseData } from "@repo/contracts/exercise";
import { createExerciseSchema } from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";
import { ContentSection } from "@repo/ui";

import { useCreateExercise, useCreateExerciseCategory } from "@app/lib/hooks";

import { ExerciseForm } from "../../components/exercise-form";

interface ExerciseCreateViewProps {
  categories: ExerciseCategory[];
}

export const ExerciseCreateView = ({ categories }: ExerciseCreateViewProps) => {
  const { mutate: createExercise, isPending } = useCreateExercise();
  const { mutateAsync: createCategory } = useCreateExerciseCategory();

  const methods = useForm<CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      videoUrl: "",
    },
  });

  const { handleSubmit } = methods;

  const handleCreateCategory = useCallback(
    (name: string) => createCategory({ name, sortOrder: categories.length }),
    [createCategory, categories.length],
  );

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Create Exercise"
        subtitle="Add a new exercise to the library"
        backgroundColor="dark"
        backHref="/exercises"
        backLabel="Back to Exercises"
        actions={[
          {
            label: "Save Exercise",
            onClick: handleSubmit((data) => createExercise(data)),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <ExerciseForm
          categories={categories}
          onCreateCategory={handleCreateCategory}
          isLoading={isPending}
        />
      </ContentSection>
    </FormProvider>
  );
};
