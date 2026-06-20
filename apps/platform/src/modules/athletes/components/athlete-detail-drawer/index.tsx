"use client";

import { useEffect, useState } from "react";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import ForumIcon from "@mui/icons-material/Forum";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";

import type { CoachAthleteDetail } from "@repo/contracts/coaching/coach-athletes";
import { LAYOUT } from "@repo/shared";

import { HealthStatusChip } from "@app/lib/components";
import { useCoachAthleteDetail } from "@app/lib/hooks";

import { HealthPane } from "./health-pane";
import { NotesPane } from "./notes-pane";
import { OpenActionItemsBlock } from "./open-action-items-block";
import { PlanPane } from "./plan-pane";
import { TodayPane } from "./today-pane";

type DrawerTab = "today" | "plan" | "notes" | "health";

const DEFAULT_TAB: DrawerTab = "today";
const AVATAR_SIZE = 48;
const SPINNER_SIZE = 30;

type AthleteDetailDrawerProps = {
  athleteId: string | null;
  visibleIds: string[];
  onClose: () => void;
  onNavigate: (userId: string) => void;
};

const getPrimaryPlanName = (detail: CoachAthleteDetail): string | null =>
  detail.planDiscipline[0]?.planName ?? null;

const getPrimaryPlanId = (detail: CoachAthleteDetail): string | null =>
  detail.planDiscipline[0]?.planId ?? null;

export const AthleteDetailDrawer: React.FC<AthleteDetailDrawerProps> = ({
  athleteId,
  visibleIds,
  onClose,
  onNavigate,
}) => {
  const { data, isLoading } = useCoachAthleteDetail(athleteId);
  const [tab, setTab] = useState<DrawerTab>(DEFAULT_TAB);

  const index = athleteId ? visibleIds.indexOf(athleteId) : -1;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < visibleIds.length - 1;

  const goPrev = (): void => {
    const id = visibleIds[index - 1];

    if (id) {
      onNavigate(id);
    }
  };

  const goNext = (): void => {
    const id = visibleIds[index + 1];

    if (id) {
      onNavigate(id);
    }
  };

  useEffect(() => {
    setTab(DEFAULT_TAB);
  }, [athleteId]);

  useEffect(() => {
    if (athleteId === null) {
      return;
    }

    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;

      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (event.key === "ArrowDown" && index >= 0 && index < visibleIds.length - 1) {
        event.preventDefault();
        const id = visibleIds[index + 1];

        if (id) {
          onNavigate(id);
        }
      }

      if (event.key === "ArrowUp" && index > 0) {
        event.preventDefault();
        const id = visibleIds[index - 1];

        if (id) {
          onNavigate(id);
        }
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [athleteId, index, visibleIds, onNavigate]);

  const displayName = data ? (data.name ?? data.email) : "";
  const primaryPlanId = data ? getPrimaryPlanId(data) : null;
  const mailtoHref = data ? `mailto:${encodeURIComponent(data.email)}` : "";

  return (
    <Drawer
      anchor="right"
      open={athleteId !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: LAYOUT.detailDrawerWidth, maxWidth: "100%" } } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={(theme) => ({ px: 1, py: 0.75, borderBottom: `1px solid ${theme.palette.divider}` })}
      >
        <IconButton size="small" aria-label="Previous athlete" disabled={!hasPrev} onClick={goPrev}>
          <KeyboardArrowUpIcon />
        </IconButton>
        <IconButton size="small" aria-label="Next athlete" disabled={!hasNext} onClick={goNext}>
          <KeyboardArrowDownIcon />
        </IconButton>

        {index >= 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {index + 1}{" "}
            <Box component="span" sx={{ color: "text.muted" }}>
              of {visibleIds.length}
            </Box>
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        <IconButton size="small" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      {isLoading || !data ? (
        <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <CircularProgress size={SPINNER_SIZE} />
        </Stack>
      ) : (
        <>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={(theme) => ({ p: 2, borderBottom: `1px solid ${theme.palette.divider}` })}
          >
            <Avatar
              {...(data.image !== null && { src: data.image })}
              alt={displayName}
              sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" noWrap>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {data.email}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <HealthStatusChip healthStatus={data.healthStatus} />
              </Stack>
            </Stack>
          </Stack>

          <Tabs value={tab} onChange={(_, value: DrawerTab) => setTab(value)} variant="fullWidth">
            <Tab value="today" label="Today" />
            <Tab value="plan" label="Plan" />
            <Tab
              value="notes"
              label={data.notes.length > 0 ? `Notes · ${data.notes.length}` : "Notes"}
            />
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
                enrollments={data.enrollments}
                planDiscipline={data.planDiscipline}
                currentWeek={data.currentWeek}
                totalWeeks={data.totalWeeks}
              />
            )}
            {tab === "notes" && <NotesPane athleteId={data.userId} notes={data.notes} />}
            {tab === "health" && <HealthPane detail={data} />}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={(theme) => ({ p: 2, borderTop: `1px solid ${theme.palette.divider}` })}
          >
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
        </>
      )}
    </Drawer>
  );
};
