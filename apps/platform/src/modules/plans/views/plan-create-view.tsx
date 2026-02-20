"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  createTrainingPlanSchema,
  type CreateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { FormView } from "@repo/ui";

import { useCreateTrainingPlan } from "@app/lib/hooks";

import { PlanForm } from "../components/plan-form";

export const PlanCreateView = () => {
  const { mutate: createPlan, isPending } = useCreateTrainingPlan();

  const methods = useForm<CreateTrainingPlanData>({
    resolver: zodResolver(createTrainingPlanSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createPlan(data)}
      isPending={isPending}
      title="Create Plan"
      subtitle="New training plan"
      backHref="/coach/plans"
      backLabel="Back to Plans"
      submitLabel="Create Plan"
    >
      <PlanForm />
    </FormView>
  );
};
