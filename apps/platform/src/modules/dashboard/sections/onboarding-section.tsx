"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

import type { OnboardingAthlete } from "@repo/contracts/coach-dashboard";

import { OnboardingStep } from "../components";

type OnboardingSectionProps = {
  athletes: OnboardingAthlete[];
};

export const OnboardingSection = ({ athletes }: OnboardingSectionProps) => {
  if (athletes.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              New Athletes
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Last 7 days
            </Typography>
          </Stack>
          <Stack>
            {athletes.map((athlete) => (
              <OnboardingStep key={athlete.userId} athlete={athlete} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
