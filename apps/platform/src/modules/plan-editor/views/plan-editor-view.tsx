"use client";

import { Stack } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { LAYOUT } from "@repo/shared";

import { useTrainingPlan } from "@app/lib/hooks";

import { PlanAthletesSection, PlanCoachAssignmentsSection } from "../../plan-detail/sections";
import { BulkActionProvider } from "../components/bulk-action-toolbar";
import {
  CommandPalette,
  CommandPaletteProvider,
  PlanCommandRegistry,
} from "../components/command-palette";
import { PlanDialogsProvider } from "../components/plan-dialogs-context";
import { PlanEditorChrome } from "../components/plan-editor-chrome";
import { PlanEditorHeader } from "../components/plan-editor-header";
import { EditingTargetProvider } from "../lib/editing-target";

const CONTAINER_VERTICAL_PADDING = 64;

export type PlanEditorViewProps = {
  planId: string;
};

type PlanEditorTab = "schedule" | "athletes";

export const PlanEditorView = ({ planId }: PlanEditorViewProps) => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: PlanEditorTab = tabParam === "athletes" ? "athletes" : "schedule";
  const { data: plan } = useTrainingPlan(planId);

  return (
    <EditingTargetProvider>
      <BulkActionProvider>
        <PlanDialogsProvider planId={planId}>
          <CommandPaletteProvider>
            <PlanCommandRegistry planId={planId} />
            <CommandPalette />
            <Stack
              spacing={3}
              sx={
                activeTab === "schedule"
                  ? {
                      height: `calc(100dvh - ${LAYOUT.platformHeaderHeight}px - ${LAYOUT.platformBottomNavHeight}px - ${CONTAINER_VERTICAL_PADDING}px)`,
                      minHeight: 0,
                    }
                  : { minHeight: 0 }
              }
            >
              <PlanEditorHeader planId={planId} activeTab={activeTab} />
              {activeTab === "schedule" ? (
                <PlanEditorChrome planId={planId} />
              ) : (
                <Stack spacing={4}>
                  <PlanAthletesSection planId={planId} />
                  {plan && (
                    <PlanCoachAssignmentsSection planId={planId} planCreatorId={plan.creatorId} />
                  )}
                </Stack>
              )}
            </Stack>
          </CommandPaletteProvider>
        </PlanDialogsProvider>
      </BulkActionProvider>
    </EditingTargetProvider>
  );
};
