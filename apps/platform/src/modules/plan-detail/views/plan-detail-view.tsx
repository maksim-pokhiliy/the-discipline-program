"use client";

import { useMemo, useState } from "react";

import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { IconButton, ListItemText, Menu, MenuItem, Stack } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { formatDateParam, getMonday, parseDateParam } from "@repo/shared";
import { PlatformPageHeader, QueryWrapper, StatusSelectChip, type StatusOption } from "@repo/ui";

import { PLAN_STATUS_CHIPS } from "@app/lib/config";
import { CatalogProvider, CloneHighlightProvider, LabelOptionsProvider } from "@app/lib/contexts";
import {
  useActivateTrainingPlan,
  useArchiveTrainingPlan,
  useRestoreTrainingPlan,
  useTrainingPlan,
  useUpdateTrainingPlan,
  useWeek,
} from "@app/lib/hooks";

import {
  CloneWeekModal,
  EnrollmentsStrip,
  ManageEnrollmentsModal,
  PlanRenameDialog,
  type PlanRenameValues,
  WeekGrid,
  WeekNavigator,
  WeekNotes,
} from "../components";

type PlanDetailViewProps = { planId: string };

export const PlanDetailView = ({ planId }: PlanDetailViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isCloneWeekOpen, setIsCloneWeekOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const weekParam = searchParams.get("week");
  const parsed = weekParam ? parseDateParam(weekParam) : null;
  const activeMonday = parsed ? getMonday(parsed) : getMonday(new Date());

  const { data: plan, isLoading, error } = useTrainingPlan(planId);
  const { data: weekData } = useWeek(planId, formatDateParam(activeMonday));
  const updatePlan = useUpdateTrainingPlan();
  const activate = useActivateTrainingPlan();
  const archive = useArchiveTrainingPlan();
  const restore = useRestoreTrainingPlan();

  const currentSessionCount = (weekData?.days ?? []).reduce(
    (sum, day) => sum + day.sessions.length,
    0,
  );

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
        return [option(TrainingPlanStatus.ACTIVE, () => activate.mutate(planId))];
      case TrainingPlanStatus.ACTIVE:
        return [option(TrainingPlanStatus.ARCHIVED, () => archive.mutate(planId))];
      case TrainingPlanStatus.ARCHIVED:
        return [option(TrainingPlanStatus.ACTIVE, () => restore.mutate(planId))];
    }
  }, [plan, planId, activate, archive, restore]);

  const pushWeekParam = (nextMonday: Date) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("week", formatDateParam(nextMonday));
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  const handleRenameSave = (values: PlanRenameValues) => {
    updatePlan.mutate({ id: planId, data: values }, { onSuccess: () => setIsRenameOpen(false) });
  };

  const openRename = () => {
    setMenuAnchor(null);
    setIsRenameOpen(true);
  };

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
      {(plan) => (
        <LabelOptionsProvider>
          <CatalogProvider>
            <CloneHighlightProvider>
              <Stack spacing={3}>
                <PlatformPageHeader
                  eyebrow="Training plan"
                  backHref="/coach/plans"
                  title={plan.name}
                  actions={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusSelectChip
                        {...PLAN_STATUS_CHIPS[plan.status]}
                        options={statusOptions}
                      />
                      <IconButton
                        aria-label="Plan actions"
                        onClick={(event) => setMenuAnchor(event.currentTarget)}
                      >
                        <MoreHorizRoundedIcon />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchor}
                        open={menuAnchor !== null}
                        onClose={() => setMenuAnchor(null)}
                      >
                        <MenuItem onClick={openRename}>
                          <ListItemText>Rename</ListItemText>
                        </MenuItem>
                      </Menu>
                    </Stack>
                  }
                />

                <EnrollmentsStrip planId={planId} onManage={() => setIsManageOpen(true)} />

                <WeekNavigator
                  monday={activeMonday}
                  onChange={pushWeekParam}
                  onCloneWeek={() => setIsCloneWeekOpen(true)}
                />

                <WeekNotes
                  key={formatDateParam(activeMonday)}
                  planId={planId}
                  monday={activeMonday}
                  notes={weekData?.week?.notes ?? null}
                />
                <WeekGrid planId={planId} monday={activeMonday} days={weekData?.days ?? []} />

                <PlanRenameDialog
                  open={isRenameOpen}
                  onClose={() => setIsRenameOpen(false)}
                  name={plan.name}
                  description={plan.description}
                  onSave={handleRenameSave}
                  isSaving={updatePlan.isPending}
                />

                <CloneWeekModal
                  open={isCloneWeekOpen}
                  onClose={() => setIsCloneWeekOpen(false)}
                  planId={planId}
                  targetStartDate={formatDateParam(activeMonday)}
                  currentSessionCount={currentSessionCount}
                />

                <ManageEnrollmentsModal
                  open={isManageOpen}
                  onClose={() => setIsManageOpen(false)}
                  planId={planId}
                  planStatus={plan.status}
                />
              </Stack>
            </CloneHighlightProvider>
          </CatalogProvider>
        </LabelOptionsProvider>
      )}
    </QueryWrapper>
  );
};
