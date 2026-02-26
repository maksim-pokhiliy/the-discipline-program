"use client";

import { useRef, useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
  type AlertColor,
  AlertTitle,
  Avatar,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";

const SEVERITY_MAP: Record<DashboardActionItem["severity"], AlertColor> = {
  CRITICAL: "error",
  WARNING: "warning",
  INFO: "info",
};

type ActionItemCardProps = {
  item: DashboardActionItem;
  onResolve: (itemId: string) => void;
  isResolving: boolean;
};

export const ActionItemAlert: React.FC<ActionItemCardProps> = ({
  item,
  onResolve,
  isResolving,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <Alert
      severity={SEVERITY_MAP[item.severity]}
      variant="filled"
      icon={<Avatar src={item.athleteImage ?? undefined}>{item.athleteName?.[0] ?? "?"}</Avatar>}
      action={
        <IconButton
          ref={anchorRef}
          size="small"
          color="inherit"
          onClick={() => setMenuOpen(true)}
          disabled={isResolving}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      }
      sx={(theme) => ({
        transition: theme.transitions.create("opacity", {
          duration: theme.transitions.duration.short,
        }),
        opacity: isResolving ? 0.5 : 1,
      })}
    >
      <Stack>
        {item.athleteName && <AlertTitle gutterBottom={false}>{item.athleteName}</AlertTitle>}

        <Typography variant="body2" color="text.secondary">
          {item.message}
        </Typography>
      </Stack>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            onResolve(item.id);
          }}
          disabled={isResolving}
        >
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Contacted</ListItemText>
        </MenuItem>

        <MenuItem component={Link} href={item.href} onClick={() => setMenuOpen(false)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Athlete</ListItemText>
        </MenuItem>
      </Menu>
    </Alert>
  );
};
