import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Stack, Typography } from "@mui/material";

import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";
import type { AthleteActionItem } from "@repo/contracts/coaching/coach-athletes";

import { formatRelativeTime } from "../athletes-roster-config";

import { SEVERITY_COLORS } from "./config";

const SEVERITY_ICONS: Record<ActionItemSeverity, React.ReactElement> = {
  [ActionItemSeverity.CRITICAL]: <ErrorOutlineIcon fontSize="small" />,
  [ActionItemSeverity.WARNING]: <WarningAmberIcon fontSize="small" />,
  [ActionItemSeverity.INFO]: <InfoOutlinedIcon fontSize="small" />,
};

type DrawerActionItemsProps = {
  actionItems: AthleteActionItem[];
};

export const DrawerActionItems: React.FC<DrawerActionItemsProps> = ({ actionItems }) => {
  if (actionItems.length === 0) {
    return null;
  }

  return (
    <Stack
      spacing={1}
      sx={(theme) => ({ p: 2, borderBottom: `1px solid ${theme.palette.divider}` })}
    >
      <Typography variant="overline" color="text.secondary">
        Open action items · {actionItems.length}
      </Typography>

      {actionItems.map((item) => (
        <Stack key={item.id} direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ color: SEVERITY_COLORS[item.severity], mt: 0.25 }}>
            {SEVERITY_ICONS[item.severity]}
          </Box>
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2">{item.message}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(item.createdAt)}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};
