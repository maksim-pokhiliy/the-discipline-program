"use client";

import { CheckCircleRounded, RadioButtonUncheckedRounded } from "@mui/icons-material";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { OnboardingAthlete } from "@repo/contracts/coach-dashboard";

type OnboardingStepProps = {
  athlete: OnboardingAthlete;
};

type StepState = "completed" | "pending";

const StepDot = ({ state, label }: { state: StepState; label: string }) => (
  <Stack spacing={0.25} sx={{ alignItems: "center" }}>
    {state === "completed" ? (
      <CheckCircleRounded sx={{ fontSize: 18, color: "success.main" }} />
    ) : (
      <RadioButtonUncheckedRounded sx={{ fontSize: 18, color: "text.disabled" }} />
    )}
    <Typography
      variant="caption"
      sx={{
        fontSize: "0.6rem",
        color: state === "completed" ? "success.main" : "text.disabled",
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
  </Stack>
);

const StepConnector = ({ active }: { active: boolean }) => (
  <Box
    sx={{
      width: 20,
      height: 2,
      bgcolor: active ? "success.main" : "divider",
      mt: "9px",
      borderRadius: 1,
    }}
  />
);

export const OnboardingStep = ({ athlete }: OnboardingStepProps) => {
  const displayName = athlete.name ?? "Unknown";
  const initials = athlete.name
    ? athlete.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const enrolledState: StepState = "completed";
  const startedState: StepState = athlete.hasAnyLog ? "completed" : "pending";
  const completedFirstState: StepState = athlete.hasCompletedFirst ? "completed" : "pending";

  return (
    <Box
      component={Link}
      href={`/coach/athletes/${athlete.userId}`}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&:active": { opacity: 0.7 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", py: 1.5, borderBottom: 1, borderColor: "divider" }}
      >
        <Avatar
          src={athlete.image ?? undefined}
          sx={{ width: 36, height: 36, bgcolor: "primary.dark", fontSize: "0.8rem" }}
        >
          {initials}
        </Avatar>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {displayName}
            </Typography>
            {athlete.planName && (
              <Typography variant="caption" sx={{ color: "text.disabled" }} noWrap>
                {athlete.planName}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" sx={{ alignItems: "flex-start" }}>
            <StepDot state={enrolledState} label="Enrolled" />
            <StepConnector active={athlete.hasAnyLog} />
            <StepDot state={startedState} label="Started" />
            <StepConnector active={athlete.hasCompletedFirst} />
            <StepDot state={completedFirstState} label="1st Done" />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};
