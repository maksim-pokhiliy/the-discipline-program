"use client";

import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";

import { type PlatformNavItem } from "@repo/shared";

import { PLATFORM_NAV_ICONS } from "@app/lib/config";

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
        {PLATFORM_NAV_ICONS[item.icon]}
      </ListItemIcon>

      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ color: isActive ? "primary.main" : "text.primary" }}
      />
    </ListItemButton>
  );
};
