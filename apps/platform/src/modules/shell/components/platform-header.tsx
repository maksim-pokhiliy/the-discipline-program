"use client";

import { AppBar, Stack, Typography } from "@mui/material";
import { usePathname } from "next/navigation";

import { COACH_NAVIGATION } from "@repo/shared";

const getPageTitle = (pathname: string): string => {
  const navItem = COACH_NAVIGATION.items.find((item) => pathname.startsWith(item.href));

  return navItem?.label ?? "";
};

export const PlatformHeader = () => {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ height: (theme) => theme.spacing(7), px: 2 }}
      >
        <Typography variant="h6" component="h1">
          {title}
        </Typography>
      </Stack>
    </AppBar>
  );
};
