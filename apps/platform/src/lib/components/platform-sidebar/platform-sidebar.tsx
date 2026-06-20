"use client";

import { Box, Drawer, List, Stack, Typography } from "@mui/material";
import { usePathname } from "next/navigation";

import { type PlatformNavigationConfig } from "@repo/shared";
import { Logo } from "@repo/ui";

import { getActiveNavIndex } from "@app/lib/config";

import { PlatformSidebarLink } from "./platform-sidebar-link";
import { PlatformSidebarUser } from "./platform-sidebar-user";

const LOGO_PX = 34;
const WORDMARK_PX = 17;
const WORDMARK = "The Discipline\nProgram";

type PlatformSidebarProps = {
  navigation: PlatformNavigationConfig;
  logoHref: string;
  profileHref: string;
  userName?: string | null | undefined;
  userEmail?: string | null | undefined;
  userImage?: string | null | undefined;
  onSignOut: () => void;
};

export const PlatformSidebar = ({
  navigation,
  logoHref,
  profileHref,
  userName,
  userEmail,
  userImage,
  onSignOut,
}: PlatformSidebarProps) => {
  const pathname = usePathname();
  const activeIndex = getActiveNavIndex(navigation.items, pathname);

  return (
    <Drawer
      variant="permanent"
      sx={{ width: (theme) => theme.layout.platformSidebarWidth, flexShrink: 0 }}
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: theme.layout.platformSidebarWidth,
            overflowX: "hidden",
            bgcolor: "background.paper",
          }),
        },
      }}
    >
      <Stack component="nav" aria-label="Coach" sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ px: 2.25, py: 2.25, borderBottom: 1, borderColor: "divider" }}
        >
          <Logo href={logoHref} width={LOGO_PX} height={LOGO_PX} />

          <Typography
            sx={(theme) => ({
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 700,
              fontSize: WORDMARK_PX,
              lineHeight: 1,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              whiteSpace: "pre-line",
              color: "text.primary",
            })}
          >
            {WORDMARK}
          </Typography>
        </Stack>

        <List sx={{ px: 1.25, py: 1.25 }}>
          {navigation.items.map((item, index) => (
            <PlatformSidebarLink key={item.href} item={item} isActive={index === activeIndex} />
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <PlatformSidebarUser
          profileHref={profileHref}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          onSignOut={onSignOut}
        />
      </Stack>
    </Drawer>
  );
};
