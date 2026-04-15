"use client";

import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, IconButton, Toolbar, Typography, useMediaQuery, type Theme } from "@mui/material";
import { usePathname } from "next/navigation";

import { LAYOUT, type AdminNavigationConfig } from "@repo/shared";
import { isActiveHref } from "@repo/ui";

type AdminHeaderProps = {
  onMenuClick: () => void;
  navigation: AdminNavigationConfig;
};

const getPageTitle = (pathname: string, config: AdminNavigationConfig): string => {
  if (pathname === config.dashboard.href) {
    return config.dashboard.text;
  }

  for (const group of config.groups) {
    for (const link of group.links) {
      if (isActiveHref(link.href, pathname)) {
        return link.text;
      }
    }
  }

  return config.dashboard.text;
};

export const AdminHeader = ({ onMenuClick, navigation }: AdminHeaderProps) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery<Theme>((theme) => theme.breakpoints.down("md"));
  const pageTitle = getPageTitle(pathname, navigation);

  if (!isMobile) {
    return null;
  }

  return (
    <AppBar
      sx={{
        height: LAYOUT.adminHeaderHeight,
        justifyContent: "center",
        borderBottom: 1,
        borderColor: "divider",
        position: "static",
        backgroundColor: "background.paper",
      }}
    >
      <Toolbar>
        <IconButton
          size="medium"
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          aria-label="Open menu"
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h3" noWrap>
          {pageTitle}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
