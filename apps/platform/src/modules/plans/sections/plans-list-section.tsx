"use client";

import { useMemo } from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import { Fab, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { TrainingPlanListItem, TrainingPlanStatus } from "@repo/contracts/training-plan";
import { useDeleteConfirmation } from "@repo/query";
import { ConfirmationModal } from "@repo/ui";

import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useDeleteTrainingPlan,
  useDuplicateTrainingPlan,
  useRestoreTrainingPlan,
} from "@app/lib/hooks";

import { PlanCard } from "../components/plan-card";

type PlansListSectionProps = {
  plans: TrainingPlanListItem[];
};

type FilterTab = {
  label: string;
  value: string;
  filter: (plan: TrainingPlanListItem) => boolean;
};

const FILTER_TABS: FilterTab[] = [
  { label: "All", value: "ALL", filter: () => true },
  { label: "Active", value: "ACTIVE", filter: (p) => p.status === "ACTIVE" },
  { label: "Draft", value: "DRAFT", filter: (p) => p.status === "DRAFT" },
  { label: "Archived", value: "ARCHIVED", filter: (p) => p.status === "ARCHIVED" },
];

export const PlansListSection = ({ plans }: PlansListSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("status") ?? "ALL";

  const deleteMutation = useDeleteTrainingPlan();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });
  const duplicateMutation = useDuplicateTrainingPlan();
  const archiveMutation = useArchiveTrainingPlan();
  const restoreMutation = useRestoreTrainingPlan();
  const activateMutation = useActivateTrainingPlan();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newValue === "ALL") {
      params.delete("status");
    } else {
      params.set("status", newValue);
    }

    const query = params.toString();

    router.replace(`/coach/plans${query ? `?${query}` : ""}`);
  };

  const currentFilter = FILTER_TABS.find((t) => t.value === activeTab) ?? FILTER_TABS[0]!;
  const filteredPlans = useMemo(() => plans.filter(currentFilter.filter), [plans, currentFilter]);

  const planToDelete = deleteId ? plans.find((p) => p.id === deleteId) : null;
  const deleteWarning =
    planToDelete?.status === "ARCHIVED" && planToDelete.enrolledAthletesCount > 0
      ? `This plan has ${planToDelete.enrolledAthletesCount} enrolled athlete(s). Deletion may fail if any enrollments are still active.`
      : undefined;

  return (
    <>
      <Stack spacing={2} sx={{ pb: 10 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={false}
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === "ALL"
                ? plans.length
                : plans.filter((p) => p.status === (tab.value as TrainingPlanStatus)).length;

            return <Tab key={tab.value} value={tab.value} label={`${tab.label} (${count})`} />;
          })}
        </Tabs>

        <Stack spacing={1.5} sx={{ px: 2 }}>
          {filteredPlans.length === 0 && (
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 6 }}>
              No plans found
            </Typography>
          )}

          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onActivate={(id) => activateMutation.mutate(id)}
              onArchive={(id) => archiveMutation.mutate(id)}
              onRestore={(id) => restoreMutation.mutate(id)}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onDelete={requestDelete}
            />
          ))}
        </Stack>
      </Stack>

      <Fab
        color="primary"
        component={Link}
        href="/coach/plans/create"
        sx={{
          position: "fixed",
          bottom: (theme) => `calc(${theme.spacing(7)} + ${theme.spacing(2)})`,
          right: (theme) => theme.spacing(2),
        }}
      >
        <AddRounded />
      </Fab>

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Training Plan"
        onClose={cancelDelete}
        type="danger"
        message="Are you sure you want to delete this training plan?"
        details={deleteWarning ?? "This action cannot be undone."}
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
};
