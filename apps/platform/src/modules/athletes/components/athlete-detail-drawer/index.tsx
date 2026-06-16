"use client";

import { useEffect, useState } from "react";

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
import { toast } from "sonner";

import { LAYOUT } from "@repo/shared";

import { HealthStatusChip } from "@app/lib/components";
import { useCoachAthleteDetail } from "@app/lib/hooks";

import { DrawerActionItems } from "./drawer-action-items";
import { HealthPane } from "./health-pane";
import { NotesPane } from "./notes-pane";
import { PlanPane } from "./plan-pane";
import { TodayPane } from "./today-pane";

type DrawerTab = "today" | "plan" | "notes" | "health";

const AVATAR_SIZE = 48;

type AthleteDetailDrawerProps = {
  athleteId: string | null;
  visibleIds: string[];
  onClose: () => void;
  onNavigate: (userId: string) => void;
};

export const AthleteDetailDrawer: React.FC<AthleteDetailDrawerProps> = ({
  athleteId,
  visibleIds,
  onClose,
  onNavigate,
}) => {
  const { data, isLoading } = useCoachAthleteDetail(athleteId);
  const [tab, setTab] = useState<DrawerTab>("today");

  const index = athleteId ? visibleIds.indexOf(athleteId) : -1;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < visibleIds.length - 1;

  const goPrev = () => {
    const id = visibleIds[index - 1];

    if (id) {
      onNavigate(id);
    }
  };

  const goNext = () => {
    const id = visibleIds[index + 1];

    if (id) {
      onNavigate(id);
    }
  };

  useEffect(() => {
    setTab("today");
  }, [athleteId]);

  useEffect(() => {
    if (athleteId === null) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
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
          <CircularProgress size={30} />
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
              {...(data.image && { src: data.image })}
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

          <Tabs
            value={tab}
            onChange={(_, value: DrawerTab) => setTab(value)}
            variant="fullWidth"
            sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}` })}
          >
            <Tab value="today" label="Today" />
            <Tab value="plan" label="Plan" />
            <Tab
              value="notes"
              label={data.notes.length > 0 ? `Notes · ${data.notes.length}` : "Notes"}
            />
            <Tab value="health" label="Health" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: "auto" }}>
            <DrawerActionItems actionItems={data.actionItems} />
            {tab === "today" && <TodayPane detail={data} />}
            {tab === "plan" && <PlanPane enrollments={data.enrollments} />}
            {tab === "notes" && <NotesPane notes={data.notes} />}
            {tab === "health" && <HealthPane detail={data} />}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={(theme) => ({ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` })}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<ForumIcon />}
              onClick={() => toast.info("Telegram messaging — coming soon")}
            >
              Message on Telegram
            </Button>
          </Stack>
        </>
      )}
    </Drawer>
  );
};
