"use client";

import { useCallback, useMemo } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Stack, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TrainingPlanListItem } from "@repo/contracts/lms/training-plan";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ChipTab, EmptyState } from "@repo/ui";

import { PlatformFab } from "@app/lib/components";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useDeleteTrainingPlan,
  useDuplicateTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

import { PlanCard } from "../components";

import { ALL_TAB, STATUS_TABS } from "./plans-list-config";

type PlansListSectionProps = {
  plans: TrainingPlanListItem[];
  onCreateClick: () => void;
};

const VALID_STATUS_VALUES = new Set<string>(Object.values(TrainingPlanStatus));

const isValidTab = (value: string): value is TrainingPlanStatus | typeof ALL_TAB =>
  value === ALL_TAB || VALID_STATUS_VALUES.has(value);

export const PlansListSection: React.FC<PlansListSectionProps> = ({ plans, onCreateClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status") ?? ALL_TAB;
  const activeTab = isValidTab(statusParam) ? statusParam : ALL_TAB;

  const setActiveTab = useCallback(
    (value: TrainingPlanStatus | typeof ALL_TAB) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === ALL_TAB) {
        params.delete("status");
      } else {
        params.set("status", value);
      }

      const qs = params.toString();

      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();
  const duplicate = useDuplicateTrainingPlan();
  const deletePlan = useDeleteTrainingPlan();

  const isPlanPending = useCallback(
    (planId: string) =>
      (activate.isPending && activate.variables === planId) ||
      (archive.isPending && archive.variables === planId) ||
      (restore.isPending && restore.variables === planId) ||
      (duplicate.isPending && duplicate.variables === planId) ||
      (deletePlan.isPending && deletePlan.variables === planId),
    [activate, archive, restore, duplicate, deletePlan],
  );

  const counts = useMemo(() => {
    const map: Record<TrainingPlanStatus | typeof ALL_TAB, number> = {
      [ALL_TAB]: plans.length,
      [TrainingPlanStatus.ACTIVE]: 0,
      [TrainingPlanStatus.DRAFT]: 0,
      [TrainingPlanStatus.ARCHIVED]: 0,
    };

    for (const plan of plans) {
      map[plan.status] = map[plan.status] + 1;
    }

    return map;
  }, [plans]);

  const filteredPlans = useMemo(
    () => (activeTab === ALL_TAB ? plans : plans.filter((p) => p.status === activeTab)),
    [plans, activeTab],
  );

  return (
    <Stack spacing={4}>
      <Tabs
        value={activeTab}
        onChange={(_, value: TrainingPlanStatus | typeof ALL_TAB) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {STATUS_TABS.map((tab) => (
          <ChipTab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            count={counts[tab.value]}
            chipColor={tab.chipColor}
          />
        ))}
      </Tabs>

      {filteredPlans.length > 0 ? (
        <Stack spacing={1.5}>
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onActivate={(id) => activate.mutate(id)}
              onArchive={(id) => archive.mutateAsync(id).then(() => undefined)}
              onRestore={(id) => restore.mutate(id)}
              onDuplicate={(id) => duplicate.mutate(id)}
              onDelete={(id) => deletePlan.mutateAsync(id).then(() => undefined)}
              isPending={isPlanPending(plan.id)}
            />
          ))}
        </Stack>
      ) : (
        <EmptyState
          message="No plans in this category"
          action={{
            label: "Create Plan",
            icon: <AddIcon />,
            onClick: onCreateClick,
          }}
        />
      )}

      <PlatformFab onClick={onCreateClick} />
    </Stack>
  );
};
