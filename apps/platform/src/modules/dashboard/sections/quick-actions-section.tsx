"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import GroupIcon from "@mui/icons-material/Group";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

type QuickAction = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Create Plan",
    href: "/coach/plans/create",
    icon: <AddCircleOutlineIcon />,
  },
  {
    label: "Athletes",
    href: "/coach/athletes",
    icon: <GroupIcon />,
  },
  {
    label: "Exercises",
    href: "/coach/exercises",
    icon: <FitnessCenterIcon />,
  },
];

export const QuickActionsSection = () => (
  <Grid container spacing={3}>
    {QUICK_ACTIONS.map((action) => (
      <Grid key={action.label} size={{ xs: 4 }}>
        <Box
          component={Link}
          href={action.href}
          sx={(theme) => ({
            display: "block",
            textDecoration: "none",
            borderRadius: 1,
            transition: theme.transitions.create("opacity"),
            "&:hover": { opacity: 0.85 },
          })}
        >
          <Paper
            variant="outlined"
            sx={(theme) => ({
              py: 2,
              textAlign: "center",
              transition: theme.transitions.create("border-color"),
              "&:hover": { borderColor: theme.palette.primary.main },
            })}
          >
            <Stack spacing={0.5} sx={{ alignItems: "center" }}>
              <Box sx={{ color: "primary.main" }}>{action.icon}</Box>

              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {action.label}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Grid>
    ))}
  </Grid>
);
