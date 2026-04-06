"use client";

import { type KeyboardEvent, useCallback, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, InputBase, Stack, Tab, Tabs } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { QueryWrapper } from "@repo/query";

import { useTrainingPlan, useUpdateTrainingPlan } from "@app/lib/hooks";

import { PlanStatusSelect } from "../components";
import { PlanAthletesSection, PlanScheduleSection } from "../sections";

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

  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (plan && !initialized) {
    setNameValue(plan.name);
    setDescValue(plan.description ?? "");
    setInitialized(true);
  }

  const activeTab = (searchParams.get("tab") as TabValue) ?? "schedule";

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

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={plan} loadingMessage="Loading plan...">
      {(data) => (
        <Stack spacing={4}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <IconButton component={Link} href="/coach/plans">
                <ArrowBackIcon />
              </IconButton>

              <InputBase
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKeyDown}
                sx={{ flex: 1, typography: "h4", "& input": { p: 0 } }}
              />

              <PlanStatusSelect planId={data.id} status={data.status} />
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
