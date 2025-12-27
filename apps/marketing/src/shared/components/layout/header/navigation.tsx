"use client";

import { Stack } from "@mui/material";
import { MARKETING_NAVIGATION } from "@repo/shared";
import { NavLinkButton } from "@repo/ui";

export const Navigation = () => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={{ sm: 2 }}>
    {MARKETING_NAVIGATION.headerLinks.map(({ text, href }) => (
      <NavLinkButton key={text} href={href}>
        {text}
      </NavLinkButton>
    ))}
  </Stack>
);
