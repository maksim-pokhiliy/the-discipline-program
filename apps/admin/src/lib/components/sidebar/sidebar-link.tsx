"use client";

import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveHref } from "@repo/ui";

import { getNavIcon } from "./icon-map";

type SidebarLinkProps = {
  text: string;
  href: string;
  icon: string;
  expanded: boolean;
};

export const SidebarLink = ({ text, href, icon, expanded }: SidebarLinkProps) => {
  const pathname = usePathname();

  const isActive = isActiveHref(href, pathname);

  const Icon = getNavIcon(icon);

  const button = (
    <ListItemButton
      component={Link}
      href={href}
      selected={isActive}
      aria-current={isActive ? "page" : undefined}
      sx={{
        px: 2.5,
        justifyContent: expanded ? "initial" : "center",
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          justifyContent: "center",
          mr: expanded ? 2 : "auto",
          color: isActive ? "primary.main" : "text.secondary",
        }}
      >
        <Icon />
      </ListItemIcon>

      {expanded && (
        <ListItemText
          primary={text}
          primaryTypographyProps={{
            noWrap: true,
            color: isActive ? "primary.main" : "text.primary",
          }}
        />
      )}
    </ListItemButton>
  );

  if (!expanded) {
    return (
      <Tooltip title={text} placement="right">
        {button}
      </Tooltip>
    );
  }

  return button;
};
