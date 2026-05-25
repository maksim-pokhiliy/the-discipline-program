"use client";

import { useMemo } from "react";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { formatDateParam, getMonday, parseDateParam } from "@repo/shared";
import { PageHeader, QueryWrapper, StatusSelectChip, type StatusOption } from "@repo/ui";

import { PLAN_STATUS_CHIPS } from "@app/lib/config";
import { LabelOptionsProvider } from "@app/lib/contexts";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useRestoreTrainingPlan,
  useTrainingPlan,
  useUpdateTrainingPlan,
  useWeek,
} from "@app/lib/hooks";

import { WeekGrid, WeekNavigator, WeekNotes } from "../components";

type PlanDetailViewProps = { planId: string };

export const PlanDetailView = ({ planId }: PlanDetailViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const weekParam = searchParams.get("week");
  const parsed = weekParam ? parseDateParam(weekParam) : null;
  const activeMonday = parsed ? getMonday(parsed) : getMonday(new Date());

  const { data: plan, isLoading, error } = useTrainingPlan(planId);
  const { data: weekData } = useWeek(planId, formatDateParam(activeMonday));
  const updatePlan = useUpdateTrainingPlan();
  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();

  const statusOptions = useMemo<StatusOption[]>(() => {
    if (!plan) {
      return [];
    }

    const option = (target: TrainingPlanStatus, onSelect: () => void): StatusOption => ({
      key: target,
      ...PLAN_STATUS_CHIPS[target],
      onSelect,
    });

    switch (plan.status) {
      case TrainingPlanStatus.DRAFT:
        return [
          option(TrainingPlanStatus.ACTIVE, () => activate.mutate(planId)),
          option(TrainingPlanStatus.ARCHIVED, () => archive.mutate(planId)),
        ];
      case TrainingPlanStatus.ACTIVE:
        return [option(TrainingPlanStatus.ARCHIVED, () => archive.mutate(planId))];
      case TrainingPlanStatus.ARCHIVED:
        return [option(TrainingPlanStatus.DRAFT, () => restore.mutate(planId))];
    }
  }, [plan, planId, activate, archive, restore]);

  const pushWeekParam = (nextMonday: Date) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("week", formatDateParam(nextMonday));
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
      {(plan) => (
        <LabelOptionsProvider>
          <Stack spacing={3}>
            <PageHeader
              editable
              title={plan.name}
              {...(plan.description !== null && { description: plan.description })}
              actions={
                <StatusSelectChip {...PLAN_STATUS_CHIPS[plan.status]} options={statusOptions} />
              }
              onTitleCommit={(next) => updatePlan.mutate({ id: planId, data: { name: next } })}
              onDescriptionCommit={(next) =>
                updatePlan.mutate({
                  id: planId,
                  data: { description: next === "" ? null : next },
                })
              }
            />

            <WeekNavigator monday={activeMonday} onChange={pushWeekParam} />
            <WeekNotes
              key={formatDateParam(activeMonday)}
              planId={planId}
              monday={activeMonday}
              notes={weekData?.week?.notes ?? null}
            />
            <WeekGrid planId={planId} monday={activeMonday} days={weekData?.days ?? []} />
          </Stack>
        </LabelOptionsProvider>
      )}
    </QueryWrapper>
  );
};
