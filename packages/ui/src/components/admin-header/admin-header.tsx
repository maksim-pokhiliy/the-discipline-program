"use client";

import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, IconButton, Toolbar, Typography, useMediaQuery, type Theme } from "@mui/material";
import { usePathname } from "next/navigation";

import { ADMIN_NAVIGATION, LAYOUT, type AdminNavigationConfig } from "@repo/shared";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

const getPageTitle = (pathname: string, config: AdminNavigationConfig): string => {
  if (pathname === config.dashboard.href) {
    return config.dashboard.text;
  }

  for (const group of config.groups) {
    for (const link of group.links) {
      if (pathname === link.href || pathname.startsWith(`${link.href}/`)) {
        return link.text;
      }
    }
  }

  return config.dashboard.text;
};

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery<Theme>((theme) => theme.breakpoints.down("md"));
  const pageTitle = getPageTitle(pathname, ADMIN_NAVIGATION);

  return (
    <AppBar
      sx={{
        height: LAYOUT.adminHeaderHeight,
        justifyContent: "center",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" noWrap>
          {pageTitle}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
