"use client";

import { type ReactNode } from "react";

import {
  EventNoteRounded,
  FitnessCenterRounded,
  GroupRounded,
  HomeRounded,
  PersonRounded,
} from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
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

    const best = COACH_NAVIGATION.items[bestIndex];

    return best && item.href.length > best.href.length ? index : bestIndex;
  }, -1);

  return (
    <BottomNavigation
      value={activeIndex}
      onChange={(_, newValue: number) => {
        const item = COACH_NAVIGATION.items[newValue];

        if (item) {
          router.push(item.href);
        }
      }}
    >
      {COACH_NAVIGATION.items.map((item) => (
        <BottomNavigationAction key={item.href} label={item.label} icon={ICON_MAP[item.icon]} />
      ))}
    </BottomNavigation>
  );
};
