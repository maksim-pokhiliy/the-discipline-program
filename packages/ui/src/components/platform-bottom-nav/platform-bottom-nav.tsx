"use client";

import { type ReactNode } from "react";

import {
  EventNoteRounded,
  FitnessCenterRounded,
  GroupRounded,
  HomeRounded,
  PersonRounded,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import { COACH_NAVIGATION } from "@repo/shared";

const ICON_MAP: Record<string, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  athletes: <GroupRounded />,
  exercises: <FitnessCenterRounded />,
  profile: <PersonRounded />,
};

export const PlatformBottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = COACH_NAVIGATION.items.reduce<number>((bestIndex, item, index) => {
    if (!pathname.startsWith(item.href)) {
      return bestIndex;
    }

    if (bestIndex === -1) {
      return index;
    }

    return item.href.length > COACH_NAVIGATION.items[bestIndex]!.href.length ? index : bestIndex;
  }, -1);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <BottomNavigation
        value={activeIndex}
        onChange={(_, newValue: number) => {
          const item = COACH_NAVIGATION.items[newValue];

          if (item) {
            router.push(item.href);
          }
        }}
        showLabels
        sx={{
          height: (theme) => theme.spacing(7),
          bgcolor: "background.paper",
        }}
      >
        {COACH_NAVIGATION.items.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={ICON_MAP[item.icon]}
            sx={{
              color: "text.secondary",
              "&.Mui-selected": {
                color: "primary.main",
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};
