"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import type { AttentionAlert } from "@repo/contracts/coach-dashboard";

import { AttentionAlertItem } from "../components";

type NeedsAttentionSectionProps = {
  alerts: AttentionAlert[];
};

export const NeedsAttentionSection: React.FC<NeedsAttentionSectionProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <Stack spacing={1} alignItems="center" py={4}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40 }} />
        <Typography variant="body2" color="text.secondary">
          All clear — no issues right now
        </Typography>
      </Stack>
    );
  }

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography variant="h6">Needs Attention</Typography>
          <Tooltip title="Missed workouts, athlete flags, new enrollees, expiring plans">
            <InfoOutlinedIcon fontSize="small" color="action" />
          </Tooltip>
          <Badge badgeContent={alerts.length} color="error" />
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1}>
          {alerts.map((alert, index) => (
            <AttentionAlertItem key={`${alert.type}-${alert.athleteId}-${index}`} alert={alert} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
