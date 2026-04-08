"use client";

import { Stack } from "@mui/material";

import { NavLinkButton } from "@repo/ui";

import { MARKETING_NAVIGATION } from "@app/lib/config";

export const Navigation = () => {
  const finalLinks = MARKETING_NAVIGATION.headerLinks;

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={0}>
      {finalLinks.map(({ text, href }) => (
        <NavLinkButton key={text} href={href} size="medium">
          {text}
        </NavLinkButton>
      ))}
    </Stack>
  );
};
