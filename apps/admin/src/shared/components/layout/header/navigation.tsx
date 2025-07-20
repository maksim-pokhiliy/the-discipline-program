"use client";

import { Stack } from "@mui/material";

import { NAV_LINKS } from "@app/shared/constants/navigation";

import { NavLinkButton } from "../../ui/nav-link-button";

export const Navigation = () => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0, sm: 2 }}>
    {NAV_LINKS.map(({ text, href }) => (
      <NavLinkButton key={text} href={href}>
        {text}
      </NavLinkButton>
    ))}
  </Stack>
);
