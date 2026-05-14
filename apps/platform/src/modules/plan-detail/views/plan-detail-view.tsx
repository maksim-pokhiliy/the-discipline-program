"use client";

import { Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDateParam, getMonday, parseDateParam } from "@repo/shared";
import { PageHeader, PlanStatusChip, QueryWrapper } from "@repo/ui";

import { useTrainingPlan, useUpdateTrainingPlan, useWeek } from "@app/lib/hooks";

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

  const pushWeekParam = (nextMonday: Date) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("week", formatDateParam(nextMonday));
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
      {(plan) => (
        <Stack spacing={4}>
          <PageHeader
            editable
            title={plan.name}
            {...(plan.description !== null && { description: plan.description })}
            backHref="/coach/plans"
            actions={<PlanStatusChip status={plan.status} />}
            onTitleCommit={(next) => updatePlan.mutate({ id: planId, data: { name: next } })}
            onDescriptionCommit={(next) =>
              updatePlan.mutate({
                id: planId,
                data: { description: next === "" ? null : next },
              })
            }
          />

          <WeekNavigator monday={activeMonday} onChange={pushWeekParam} />
          <WeekNotes planId={planId} monday={activeMonday} notes={weekData?.week?.notes ?? null} />
          <WeekGrid monday={activeMonday} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
