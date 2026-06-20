"use client";

import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { type PlatformNavigationConfig } from "@repo/shared";

import { getActiveNavIndex, PLATFORM_NAV_ICONS } from "@app/lib/config";

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
          icon={PLATFORM_NAV_ICONS[item.icon]}
          aria-current={index === activeIndex ? "page" : undefined}
        />
      ))}
    </BottomNavigation>
  );
};
