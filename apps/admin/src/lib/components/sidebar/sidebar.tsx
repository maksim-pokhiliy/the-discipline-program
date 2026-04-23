"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  Stack,
  useMediaQuery,
  type Theme,
} from "@mui/material";

import { LAYOUT, type AdminNavigationConfig } from "@repo/shared";
import { Logo } from "@repo/ui";

import { SidebarLink } from "./sidebar-link";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUserMenu } from "./sidebar-user-menu";

const collectNavHrefs = (config: AdminNavigationConfig): string[] => {
  const hrefs: string[] = [config.dashboard.href];

  for (const group of config.groups) {
    for (const link of group.links) {
      hrefs.push(link.href);
    }
  }

  return hrefs;
};

type SidebarProps = {
  config: AdminNavigationConfig;
  expanded: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  userEmail: string;
  onSignOut: () => void;
};

const drawerTransition = (theme: Theme) =>
  theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

export const Sidebar = ({
  config,
  expanded,
  onToggle,
  mobileOpen,
  onMobileClose,
  userEmail,
  onSignOut,
}: SidebarProps) => {
  const isDesktop = useMediaQuery<Theme>((theme) => theme.breakpoints.up("md"));
  const isExpanded = isDesktop ? expanded : true;
  const width = expanded ? LAYOUT.drawerWidth : LAYOUT.drawerCollapsedWidth;
  const siblingHrefs = collectNavHrefs(config);

  const content = (
    <Stack sx={{ height: "100%" }}>
      <Stack
        spacing={2}
        direction={isExpanded ? "row" : "column"}
        alignItems="center"
        justifyContent={isExpanded ? "space-between" : "center"}
        sx={{
          px: isExpanded ? 2 : 0,
          py: 2,
          minHeight: LAYOUT.adminHeaderHeight,
          gap: isExpanded ? 0 : 0.5,
        }}
      >
        <Logo
          width={isExpanded ? LAYOUT.sidebarLogoExpanded : LAYOUT.sidebarLogoCollapsed}
          height={isExpanded ? LAYOUT.sidebarLogoExpanded : LAYOUT.sidebarLogoCollapsed}
        />

        <IconButton onClick={isDesktop ? onToggle : onMobileClose} aria-label="Toggle sidebar">
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Stack>

      <Divider />

      <List disablePadding>
        <SidebarLink
          text={config.dashboard.text}
          href={config.dashboard.href}
          icon={config.dashboard.icon}
          expanded={isExpanded}
          siblingHrefs={siblingHrefs}
        />
      </List>

      <SidebarNav groups={config.groups} expanded={isExpanded} siblingHrefs={siblingHrefs} />

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <SidebarUserMenu expanded={isExpanded} email={userEmail} onSignOut={onSignOut} />
    </Stack>
  );

  if (!isDesktop) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        slotProps={{
          root: { keepMounted: true },
          paper: { sx: { width: LAYOUT.drawerWidth } },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        transition: drawerTransition,
      }}
      slotProps={{
        paper: {
          sx: {
            width,
            overflowX: "hidden",
            transition: drawerTransition,
          },
        },
      }}
    >
      {content}
    </Drawer>
  );
};
