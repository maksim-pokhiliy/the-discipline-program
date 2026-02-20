"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateTrainingPlanSchema,
  type TrainingPlan,
  type UpdateTrainingPlanData,
} from "@repo/contracts/training-plan";
import { QueryWrapper } from "@repo/query";
import { FormView } from "@repo/ui";

import { useTrainingPlan, useUpdateTrainingPlan } from "@app/lib/hooks";

import { PlanForm } from "../components/plan-form";

type PlanEditViewProps = {
  planId: string;
};

type PlanEditFormProps = {
  plan: TrainingPlan;
};

const PlanEditForm = ({ plan }: PlanEditFormProps) => {
  const { mutate: updatePlan, isPending } = useUpdateTrainingPlan();

  const methods = useForm<UpdateTrainingPlanData>({
    resolver: zodResolver(updateTrainingPlanSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description ?? "",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updatePlan({ id: plan.id, data })}
      isPending={isPending}
      title="Edit Plan"
      subtitle={plan.name}
      backHref="/coach/plans"
      backLabel="Back to Plans"
    >
      <PlanForm />
    </FormView>
  );
};

export const PlanEditView = ({ planId }: PlanEditViewProps) => {
  const { data, isLoading, error } = useTrainingPlan(planId);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading plan...">
      {(plan) => <PlanEditForm plan={plan} />}
    </QueryWrapper>
  );
};
