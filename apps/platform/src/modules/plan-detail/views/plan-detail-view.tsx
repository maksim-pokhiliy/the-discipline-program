"use client";

import { useCallback, useEffect, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, InputBase, Stack, Tab, Tabs } from "@mui/material";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LoadingState, QueryWrapper } from "@repo/ui";

import { useTrainingPlan, useUpdateTrainingPlan } from "@app/lib/hooks";

import { PlanStatusSelect } from "../components";
import { PlanAthletesSection } from "../sections";

const PlanScheduleSection = dynamic(
  () =>
    import("../sections/plan-schedule-section").then((m) => ({ default: m.PlanScheduleSection })),
  { ssr: false, loading: () => <LoadingState message="Loading schedule..." /> },
);

type PlanDetailViewProps = {
  planId: string;
};

type TabValue = "schedule" | "athletes";

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

  const rawTab = searchParams.get("tab");
  const activeTab: TabValue = rawTab === "athletes" ? "athletes" : "schedule";

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("tab", value);

      if (value !== "schedule") {
        params.delete("week");
      }

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
              <IconButton component={Link} href="/coach/plans">
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
            <Tab value="schedule" label="Schedule" />
            <Tab value="athletes" label="Athletes" />
          </Tabs>

          {activeTab === "schedule" && <PlanScheduleSection planId={planId} />}
          {activeTab === "athletes" && <PlanAthletesSection planId={planId} />}
        </Stack>
      )}
    </QueryWrapper>
  );
};
