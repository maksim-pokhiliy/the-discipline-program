"use client";

import { Stack } from "@mui/material";

import { ADMIN_NAVIGATION, MARKETING_NAVIGATION, type NavLink } from "@repo/shared";

import { NavLinkButton } from "../nav-link-button";

type NavigationProps = {
  links?: NavLink[];
  navigationType?: "admin" | "marketing";
};

export const Navigation = ({ links, navigationType = "admin" }: NavigationProps) => {
  const navData =
    navigationType === "admin" ? ADMIN_NAVIGATION.links : MARKETING_NAVIGATION.headerLinks;

  const finalLinks = links || navData;

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0, sm: 2 }}>
      {finalLinks.map(({ text, href }) => (
        <NavLinkButton key={text} href={href}>
          {text}
        </NavLinkButton>
      ))}
    </Stack>
  );
};
