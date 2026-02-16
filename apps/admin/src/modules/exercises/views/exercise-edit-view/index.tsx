"use client";

import { useCallback } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { type CreateExerciseData, type Exercise } from "@repo/contracts/exercise";
import { createExerciseSchema } from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";
import { ContentSection } from "@repo/ui";

import {
  useCreateExerciseCategory,
  useExercise,
  useExerciseCategories,
  useUpdateExercise,
} from "@app/lib/hooks";

import { ExerciseForm } from "../../components/exercise-form";

interface ExerciseEditViewProps {
  initialData: Exercise;
  categories: ExerciseCategory[];
}

export const ExerciseEditView = ({
  initialData,
  categories: initialCategories,
}: ExerciseEditViewProps) => {
  const { data: exercise } = useExercise(initialData.id, initialData);
  const { data: categories = initialCategories } = useExerciseCategories(initialCategories);
  const { mutate: updateExercise, isPending } = useUpdateExercise();
  const { mutateAsync: createCategory } = useCreateExerciseCategory();

  const methods = useForm<CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: exercise?.name ?? "",
      description: exercise?.description ?? "",
      videoUrl: exercise?.videoUrl ?? "",
      categoryId: exercise?.categoryId ?? "",
    },
  });

  const { handleSubmit } = methods;

  const handleCreateCategory = useCallback(
    (name: string) => createCategory({ name, sortOrder: categories.length }),
    [createCategory, categories.length],
  );

  if (!exercise) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Edit Exercise"
        subtitle={exercise.name}
        backgroundColor="dark"
        backHref="/exercises"
        backLabel="Back to Exercises"
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit((data) => updateExercise({ id: exercise.id, data })),
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
