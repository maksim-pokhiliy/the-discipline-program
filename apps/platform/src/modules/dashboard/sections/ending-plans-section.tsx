"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

import type { EndingPlan } from "@repo/contracts/coach-dashboard";

import { EndingPlanRow } from "../components";

type EndingPlansSectionProps = {
  plans: EndingPlan[];
};

export const EndingPlansSection = ({ plans }: EndingPlansSectionProps) => {
  if (plans.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Ending Plans
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Next 14 days
            </Typography>
          </Stack>
          <Stack>
            {plans.map((plan) => (
              <EndingPlanRow key={`${plan.athleteId}-${plan.planId}`} plan={plan} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
