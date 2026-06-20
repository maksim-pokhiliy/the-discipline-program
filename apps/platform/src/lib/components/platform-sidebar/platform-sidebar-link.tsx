"use client";

import { type ReactNode } from "react";

import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LeaderboardRounded from "@mui/icons-material/LeaderboardRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";

import { type PlatformIconName, type PlatformNavItem } from "@repo/shared";

const ICON_MAP: Record<PlatformIconName, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  athletes: <GroupRounded />,
  profile: <PersonRounded />,
  leaderboard: <LeaderboardRounded />,
};

type PlatformSidebarLinkProps = {
  item: PlatformNavItem;
  isActive: boolean;
};

export const PlatformSidebarLink = ({ item, isActive }: PlatformSidebarLinkProps) => {
  return (
    <ListItemButton
      component={Link}
      href={item.href}
      selected={isActive}
      aria-current={isActive ? "page" : undefined}
      sx={{ borderRadius: "4px" }}
    >
      <ListItemIcon
        sx={{ minWidth: 0, mr: 1.75, color: isActive ? "primary.main" : "text.secondary" }}
      >
        {ICON_MAP[item.icon]}
      </ListItemIcon>

      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ color: isActive ? "primary.main" : "text.primary" }}
      />
    </ListItemButton>
  );
};
