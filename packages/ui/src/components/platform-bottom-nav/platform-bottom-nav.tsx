"use client";

import { type ReactNode } from "react";

import { EventNoteRounded, GroupRounded, HomeRounded, PersonRounded } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { type PlatformNavigationConfig } from "@repo/shared";

const ICON_MAP: Record<string, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  athletes: <GroupRounded />,
  profile: <PersonRounded />,
};

type PlatformBottomNavProps = {
  navigation: PlatformNavigationConfig;
};

export const PlatformBottomNav = ({ navigation }: PlatformBottomNavProps) => {
  const pathname = usePathname();

  const activeIndex = navigation.items.reduce<number>((bestIndex, item, index) => {
    if (!pathname.startsWith(item.href)) {
      return bestIndex;
    }

    if (bestIndex === -1) {
      return index;
    }

    const best = navigation.items[bestIndex];

    return best && item.href.length > best.href.length ? index : bestIndex;
  }, -1);

  return (
    <BottomNavigation value={activeIndex}>
      {navigation.items.map((item) => (
        <BottomNavigationAction
          key={item.href}
          component={Link}
          href={item.href}
          label={item.label}
          icon={ICON_MAP[item.icon]}
        />
      ))}
    </BottomNavigation>
  );
};
