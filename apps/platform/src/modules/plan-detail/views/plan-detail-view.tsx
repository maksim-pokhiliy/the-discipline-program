"use client";

import { useCallback, useEffect, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, InputBase, Stack, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EditSessionAwareLink, QueryWrapper } from "@repo/ui";

import { useTrainingPlan, useUpdateTrainingPlan } from "@app/lib/hooks";

import { PlanStatusSelect } from "../components";
import { PlanAthletesSection, PlanCoachAssignmentsSection } from "../sections";

type PlanDetailViewProps = {
  planId: string;
};

type TabValue = "athletes";

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId }) => {
  const { data: plan, isLoading, error } = useTrainingPlan(planId);
  const updatePlan = useUpdateTrainingPlan();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const planName = plan?.name ?? "";
  const planDescription = plan?.description ?? "";
  const planDataId = plan?.id;
  const [nameValue, setNameValue] = useState(planName);
  const [descValue, setDescValue] = useState(planDescription);

  useEffect(() => {
    setNameValue(planName);
    setDescValue(planDescription);
  }, [planDataId, planName, planDescription]);

  const activeTab: TabValue = "athletes";

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("tab", value);
      params.delete("week");

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const commitName = useCallback(() => {
    const trimmed = nameValue.trim();

    if (trimmed && plan && trimmed !== plan.name) {
      updatePlan.mutate({ id: planId, data: { name: trimmed } });
    } else if (plan) {
      setNameValue(plan.name);
    }
  }, [nameValue, plan, planId, updatePlan]);

  const commitDescription = useCallback(() => {
    if (!plan) {
      return;
    }

    const trimmed = descValue.trim();
    const current = plan.description ?? "";

    if (trimmed !== current) {
      updatePlan.mutate({ id: planId, data: { description: trimmed || null } });
    }
  }, [descValue, plan, planId, updatePlan]);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
      {(data) => (
        <Stack spacing={4}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                component={EditSessionAwareLink}
                href="/coach/plans"
                aria-label="Back to plans"
              >
                <ArrowBackIcon />
              </IconButton>

              <InputBase
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitName}
                sx={{ flex: 1, typography: "h4", "& input": { p: 0 } }}
              />

              <PlanStatusSelect planId={data.id} planName={data.name} status={data.status} />
            </Stack>

            <InputBase
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={commitDescription}
              placeholder="Add description..."
              multiline
              sx={{ typography: "body1", color: "text.secondary", "& textarea": { p: 0 } }}
            />
          </Stack>

          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab value="athletes" label="Athletes" />
          </Tabs>

          {activeTab === "athletes" && (
            <Stack spacing={4}>
              <PlanAthletesSection planId={planId} />
              <PlanCoachAssignmentsSection planId={planId} planCreatorId={data.creatorId} />
            </Stack>
          )}
        </Stack>
      )}
    </QueryWrapper>
  );
};
