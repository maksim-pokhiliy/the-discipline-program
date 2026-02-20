"use client";

import { useState } from "react";

import {
  ExpandLessRounded,
  ExpandMoreRounded,
  NotificationsActiveRounded,
} from "@mui/icons-material";
import { Card, CardContent, Chip, Collapse, IconButton, Stack, Typography } from "@mui/material";

import type { AttentionAlert } from "@repo/contracts/coach-dashboard";

import { AttentionAlertItem } from "../components";

type AttentionSectionProps = {
  alerts: AttentionAlert[];
};

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;

export const AttentionSection = ({ alerts }: AttentionSectionProps) => {
  const [expanded, setExpanded] = useState(alerts.length > 0);

  const sorted = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: criticalCount > 0 ? "error.dark" : "divider",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <NotificationsActiveRounded
              sx={{
                fontSize: 20,
                color: criticalCount > 0 ? "error.main" : "warning.main",
              }}
            />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Needs Attention
            </Typography>
            {alerts.length > 0 && (
              <Chip
                label={alerts.length}
                size="small"
                color={criticalCount > 0 ? "error" : "warning"}
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
              />
            )}
          </Stack>
          <IconButton size="small">
            {expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          </IconButton>
        </Stack>
        <Collapse in={expanded}>
          {sorted.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
              All clear! No issues requiring attention.
            </Typography>
          ) : (
            <Stack sx={{ mt: 1 }}>
              {sorted.map((alert, index) => (
                <AttentionAlertItem
                  key={`${alert.type}-${alert.athleteId}-${index}`}
                  alert={alert}
                />
              ))}
            </Stack>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};
