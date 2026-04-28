"use client";

import { useCallback, useEffect, useState, type SyntheticEvent } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, InputBase, Stack, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EditSessionAwareLink } from "@repo/ui";

import { useTrainingPlan, useUpdateTrainingPlan } from "@app/lib/hooks";

import { PlanStatusSelect } from "../../plan-detail/components";

type PlanEditorHeaderTab = "schedule" | "athletes";

type PlanEditorHeaderProps = {
  planId: string;
  activeTab: PlanEditorHeaderTab;
};

export const PlanEditorHeader = ({ planId, activeTab }: PlanEditorHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: plan } = useTrainingPlan(planId);
  const updatePlan = useUpdateTrainingPlan();

  const planName = plan?.name ?? "";
  const planDescription = plan?.description ?? "";
  const planDataId = plan?.id;

  const [nameValue, setNameValue] = useState(planName);
  const [descValue, setDescValue] = useState(planDescription);

  useEffect(() => {
    setNameValue(planName);
    setDescValue(planDescription);
  }, [planDataId, planName, planDescription]);

  const handleTabChange = useCallback(
    (_: SyntheticEvent, value: PlanEditorHeaderTab) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("tab", value);
      params.delete("week");

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
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
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          component={EditSessionAwareLink}
          href="/coach/plans"
          aria-label="Back to plans"
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>

        <InputBase
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={commitName}
          sx={{ flex: 1, typography: "h5", "& input": { p: 0 } }}
        />

        {plan && <PlanStatusSelect planId={plan.id} planName={plan.name} status={plan.status} />}
      </Stack>

      <InputBase
        value={descValue}
        onChange={(e) => setDescValue(e.target.value)}
        onBlur={commitDescription}
        placeholder="Add description..."
        multiline
        sx={{ typography: "body2", color: "text.secondary", "& textarea": { p: 0 } }}
      />

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab value="schedule" label="Schedule" />
        <Tab value="athletes" label="Athletes" />
      </Tabs>
    </Stack>
  );
};
