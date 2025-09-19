"use client";

import { Stack } from "@mui/material";

import { NAV_LINKS } from "@app/shared/constants";

import { NavLinkButton } from "../../ui";

export const Navigation = () => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={{ sm: 2 }}>
    {NAV_LINKS.map(({ text, href }) => (
      <NavLinkButton key={text} href={href}>
        {text}
      </NavLinkButton>
    ))}
  </Stack>
);
