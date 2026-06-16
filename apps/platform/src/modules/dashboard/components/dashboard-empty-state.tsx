"use client";

import { type ReactElement } from "react";

import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

const MARK_SIZE_PX = 64;
const MARK_ICON_SIZE_PX = 36;
const TITLE_FONT_SIZE_PX = 32;
const STEP_BADGE_SIZE_PX = 24;
const STEP_BADGE_FONT_SIZE_PX = 12;
const STEP_TITLE_FONT_SIZE_PX = 13;
const STEP_DESC_FONT_SIZE_PX = 12;
const SUB_FONT_SIZE_PX = 14;
const SUB_MAX_WIDTH_PX = 420;
const CHECKLIST_MAX_WIDTH_PX = 380;
const WRAP_PADDING_TOP_PX = 48;
const WRAP_PADDING_BOTTOM_PX = 80;

const PLANS_HREF = "/coach/plans";
const ATHLETES_HREF = "/coach/athletes";

const TITLE = "No athletes yet.";
const DRAFT_PLAN_LABEL = "Draft a plan";
const INVITE_ATHLETES_LABEL = "Invite athletes";

type ChecklistStep = {
  title: string;
  description: string;
};

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    title: "Draft your first plan",
    description:
      "The plan is the train. Athletes ride it on its schedule — they don't make it up later.",
  },
  {
    title: "Invite athletes",
    description: "Send invites by email. They subscribe; they board.",
  },
  {
    title: "Open this screen tomorrow",
    description: "Action items, missed sessions and progress show up here — sorted, by priority.",
  },
];

export type DashboardEmptyStateProps = {
  coachName: string | null;
};

export const DashboardEmptyState = ({ coachName }: DashboardEmptyStateProps): ReactElement => (
  <Stack
    alignItems="center"
    justifyContent="center"
    spacing={2.5}
    sx={{
      textAlign: "center",
      px: 2,
      pt: `${WRAP_PADDING_TOP_PX}px`,
      pb: `${WRAP_PADDING_BOTTOM_PX}px`,
    }}
  >
    <Box
      sx={(theme) => ({
        width: MARK_SIZE_PX,
        height: MARK_SIZE_PX,
        borderRadius: theme.spacing(0.5),
        border: `1px solid ${theme.palette.divider}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.palette.primary.main,
        "& svg": { fontSize: (t) => t.typography.pxToRem(MARK_ICON_SIZE_PX) },
      })}
    >
      <GroupAddIcon />
    </Box>

    <Stack spacing={1.5} alignItems="center">
      <Typography
        component="h2"
        sx={(theme) => ({
          fontFamily: "var(--font-display)",
          fontWeight: theme.typography.fontWeightBold,
          fontSize: theme.typography.pxToRem(TITLE_FONT_SIZE_PX),
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          color: theme.palette.text.primary,
        })}
      >
        {TITLE}
      </Typography>

      <Typography
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(SUB_FONT_SIZE_PX),
          color: theme.palette.text.secondary,
          maxWidth: SUB_MAX_WIDTH_PX,
          lineHeight: 1.55,
        })}
      >
        {coachName === null ? "Welcome." : `Welcome, ${coachName}.`} The dashboard wakes up once
        athletes board your first plan. Three steps to get the train moving.
      </Typography>
    </Stack>

    <Stack spacing={1} sx={{ width: "100%", maxWidth: CHECKLIST_MAX_WIDTH_PX, textAlign: "left" }}>
      {CHECKLIST_STEPS.map((step, index) => (
        <Stack
          key={step.title}
          direction="row"
          spacing={1.25}
          alignItems="flex-start"
          sx={(theme) => ({
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(0.5),
            p: 1.5,
          })}
        >
          <Box
            sx={(theme) => ({
              width: STEP_BADGE_SIZE_PX,
              height: STEP_BADGE_SIZE_PX,
              flexShrink: 0,
              borderRadius: "50%",
              border: `1px solid ${theme.palette.divider}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: theme.typography.fontWeightBold,
              fontSize: theme.typography.pxToRem(STEP_BADGE_FONT_SIZE_PX),
              color: theme.palette.text.secondary,
            })}
          >
            {index + 1}
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(STEP_TITLE_FONT_SIZE_PX),
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.text.primary,
                lineHeight: 1.3,
              })}
            >
              {step.title}
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(STEP_DESC_FONT_SIZE_PX),
                color: theme.palette.text.secondary,
                lineHeight: 1.4,
              })}
            >
              {step.description}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>

    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
      <Button
        component={Link}
        href={PLANS_HREF}
        variant="contained"
        size="small"
        startIcon={<EventNoteIcon />}
      >
        {DRAFT_PLAN_LABEL}
      </Button>
      <Button
        component={Link}
        href={ATHLETES_HREF}
        variant="outlined"
        size="small"
        startIcon={<PersonAddIcon />}
      >
        {INVITE_ATHLETES_LABEL}
      </Button>
    </Stack>
  </Stack>
);
