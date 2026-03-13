"use client";

import { useCallback } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { QueryWrapper } from "@repo/query";

import { useTrainingPlan } from "@app/lib/hooks";
import { PlanStatusChip } from "@app/modules/plans/components";

import { PlanAthletesSection } from "../sections";
import { PlanScheduleSection } from "../sections";

type PlanDetailViewProps = {
  planId: string;
};

type TabValue = "schedule" | "athletes";

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId }) => {
  const { data: plan, isLoading, error } = useTrainingPlan(planId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <Stack spacing={2}>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={plan}
        loadingMessage="Loading plan..."
      >
        {(data) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <IconButton component={Link} href="/coach/plans" size="small">
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h6" noWrap sx={{ flex: 1, fontWeight: 600 }}>
              {data.name}
            </Typography>

            <PlanStatusChip status={data.status} />
          </Stack>
        )}
      </QueryWrapper>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab value="schedule" label="Schedule" />
        <Tab value="athletes" label="Athletes" />
      </Tabs>

      {activeTab === "schedule" && <PlanScheduleSection planId={planId} />}
      {activeTab === "athletes" && <PlanAthletesSection planId={planId} />}
    </Stack>
  );
};
