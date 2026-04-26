"use client";

import { type ReactNode } from "react";

import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LibraryBooksRounded from "@mui/icons-material/LibraryBooksRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { usePathname } from "next/navigation";

import { type PlatformIconName, type PlatformNavigationConfig } from "@repo/shared";
import { EditSessionAwareLink } from "@repo/ui";

const ICON_MAP: Record<PlatformIconName, ReactNode> = {
  home: <HomeRounded />,
  plans: <EventNoteRounded />,
  library: <LibraryBooksRounded />,
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
    <BottomNavigation
      value={activeIndex}
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: "appBar" }}
    >
      {navigation.items.map((item, index) => (
        <BottomNavigationAction
          key={item.href}
          component={EditSessionAwareLink}
          href={item.href}
          label={item.label}
          icon={ICON_MAP[item.icon]}
          aria-current={index === activeIndex ? "page" : undefined}
        />
      ))}
    </BottomNavigation>
  );
};
