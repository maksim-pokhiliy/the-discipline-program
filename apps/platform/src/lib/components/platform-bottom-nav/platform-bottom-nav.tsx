"use client";

import { type ReactNode } from "react";

import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LeaderboardRounded from "@mui/icons-material/LeaderboardRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { type PlatformIconName, type PlatformNavigationConfig } from "@repo/shared";

import { getActiveNavIndex } from "@app/lib/config";

const ICON_MAP: Record<PlatformIconName, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  athletes: <GroupRounded />,
  profile: <PersonRounded />,
  leaderboard: <LeaderboardRounded />,
};

type PlatformBottomNavProps = {
  navigation: PlatformNavigationConfig;
};

export const PlatformBottomNav = ({ navigation }: PlatformBottomNavProps) => {
  const pathname = usePathname();

  const activeIndex = getActiveNavIndex(navigation.items, pathname);

  return (
    <BottomNavigation
      value={activeIndex}
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: "appBar" }}
    >
      {navigation.items.map((item, index) => (
        <BottomNavigationAction
          key={item.href}
          component={Link}
          href={item.href}
          label={item.label}
          icon={ICON_MAP[item.icon]}
          aria-current={index === activeIndex ? "page" : undefined}
        />
      ))}
    </BottomNavigation>
  );
};
