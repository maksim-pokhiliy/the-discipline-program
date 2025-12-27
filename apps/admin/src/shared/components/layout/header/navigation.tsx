"use client";

import { Stack } from "@mui/material";
import { ADMIN_NAVIGATION } from "@repo/shared";
import { NavLinkButton } from "@repo/ui";

export const Navigation = () => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0, sm: 2 }}>
    {ADMIN_NAVIGATION.links.map(({ text, href }) => (
      <NavLinkButton key={text} href={href}>
        {text}
      </NavLinkButton>
    ))}
  </Stack>
);
