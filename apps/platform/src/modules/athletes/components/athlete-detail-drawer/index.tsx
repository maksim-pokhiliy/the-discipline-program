"use client";

import { useEffect, useState } from "react";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ForumIcon from "@mui/icons-material/Forum";
import { Avatar, Button, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";

import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { DetailDrawer, StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";
import { useCoachAthleteDetail } from "@app/lib/hooks";

import { TODAY_STATUS_CHIPS } from "./config";
import { HealthPane } from "./health-pane";
import { NotesPane } from "./notes-pane";
import { OpenActionItemsBlock } from "./open-action-items-block";
import { PlanPane } from "./plan-pane";
import { TodayPane } from "./today-pane";

type AthleteDetailDrawerProps = {
  athleteId: string | null;
  onClose: () => void;
};

type DrawerTab = "today" | "plan" | "notes" | "health";

const DEFAULT_TAB: DrawerTab = "today";
const AVATAR_SIZE = 6;

const getPrimaryPlanName = (detail: CoachAthleteDetail): string | null =>
  detail.planDiscipline[0]?.planName ?? null;

const getPrimaryPlanId = (detail: CoachAthleteDetail): string | null =>
  detail.planDiscipline[0]?.planId ?? null;

export const AthleteDetailDrawer: React.FC<AthleteDetailDrawerProps> = ({ athleteId, onClose }) => {
  const { data, isLoading } = useCoachAthleteDetail(athleteId);
  const [tab, setTab] = useState<DrawerTab>(DEFAULT_TAB);

  useEffect(() => {
    setTab(DEFAULT_TAB);
  }, [athleteId]);

  const displayName = data ? (data.name ?? data.email) : "";
  const primaryPlanId = data ? getPrimaryPlanId(data) : null;
  const mailtoHref = data ? `mailto:${encodeURIComponent(data.email)}` : "";

  return (
    <DetailDrawer
      open={!!athleteId}
      onClose={onClose}
      title={displayName}
      loading={isLoading || !data}
    >
      {data && (
        <Stack sx={{ flex: 1, minHeight: 0 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ px: 2, pb: 1.5 }}>
            <Avatar
              {...(data.image !== null && { src: data.image })}
              alt={displayName}
              sx={(theme) => ({
                width: theme.spacing(AVATAR_SIZE),
                height: theme.spacing(AVATAR_SIZE),
              })}
            />
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap sx={{ color: "text.primary" }}>
                {displayName}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
              >
                {data.email}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                <StatusChip {...TODAY_STATUS_CHIPS[data.todayStatus]} />
                <StatusChip {...HEALTH_STATUS_CHIPS[data.healthStatus]} />
              </Stack>
            </Stack>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value: DrawerTab) => setTab(value)}
            variant="fullWidth"
            sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}` })}
          >
            <Tab value="today" label="Today" />
            <Tab value="plan" label="Plan" />
            <Tab value="notes" label="Notes" />
            <Tab value="health" label="Health" />
          </Tabs>

          <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
            <OpenActionItemsBlock athleteId={data.userId} actionItems={data.actionItems} />

            {tab === "today" && (
              <TodayPane
                todayWorkoutTitle={data.todayWorkoutTitle}
                planName={getPrimaryPlanName(data)}
                currentWeek={data.currentWeek}
                totalWeeks={data.totalWeeks}
                last7Days={data.last7Days}
                consistency={data.consistency}
              />
            )}
            {tab === "plan" && (
              <PlanPane
                planDiscipline={data.planDiscipline}
                currentWeek={data.currentWeek}
                totalWeeks={data.totalWeeks}
              />
            )}
            {tab === "notes" && <NotesPane athleteId={data.userId} />}
            {tab === "health" && <HealthPane athleteId={data.userId} />}
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1} sx={{ p: 2 }}>
            <Button
              component="a"
              href={mailtoHref}
              variant="outlined"
              size="small"
              startIcon={<ForumIcon />}
              sx={{ flex: 1 }}
            >
              Message
            </Button>
            {primaryPlanId !== null && (
              <Button
                component={Link}
                href={`/coach/plans/${primaryPlanId}`}
                variant="contained"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ flex: 1 }}
              >
                Open plan
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </DetailDrawer>
  );
};
