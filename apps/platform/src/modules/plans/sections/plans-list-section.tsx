"use client";

import { useCallback, useMemo, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Fab, Stack, Tabs, Typography } from "@mui/material";

import type { TrainingPlanListItem } from "@repo/contracts/training-plan";
import { TrainingPlanStatus } from "@repo/contracts/training-plan";
import { LAYOUT } from "@repo/shared";

import { ChipTab } from "@app/lib/components";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useDeleteTrainingPlan,
  useDuplicateTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

import { PlanCard } from "../components";

import { STATUS_TABS } from "./plans-list-config";

type PlansListSectionProps = {
  plans: TrainingPlanListItem[];
  onCreateClick: () => void;
};

export const PlansListSection: React.FC<PlansListSectionProps> = ({ plans, onCreateClick }) => {
  const [activeTab, setActiveTab] = useState<TrainingPlanStatus | "ALL">("ALL");

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
    const map: Record<string, number> = { ALL: plans.length };

    for (const status of Object.values(TrainingPlanStatus)) {
      map[status] = 0;
    }

    for (const plan of plans) {
      map[plan.status] = (map[plan.status] ?? 0) + 1;
    }

    return map;
  }, [plans]);

  const filteredPlans = useMemo(
    () => (activeTab === "ALL" ? plans : plans.filter((p) => p.status === activeTab)),
    [plans, activeTab],
  );

  return (
    <Stack spacing={4}>
      <Tabs
        value={activeTab}
        onChange={(_, value: TrainingPlanStatus | "ALL") => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {STATUS_TABS.map((tab) => (
          <ChipTab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            count={counts[tab.value] ?? 0}
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
              onArchive={(id) => archive.mutate(id)}
              onRestore={(id) => restore.mutate(id)}
              onDuplicate={(id) => duplicate.mutate(id)}
              onDelete={(id) => deletePlan.mutate(id)}
              isPending={isPlanPending(plan.id)}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
          No plans in this category
        </Typography>
      )}

      <Fab
        color="primary"
        onClick={onCreateClick}
        sx={{ position: "fixed", bottom: LAYOUT.platformFabBottom, right: 2 }}
      >
        <AddIcon />
      </Fab>
    </Stack>
  );
};
