"use client";

import { Stack } from "@mui/material";

import { MARKETING_NAVIGATION } from "@repo/shared";
import { NavLinkButton } from "@repo/ui";

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
