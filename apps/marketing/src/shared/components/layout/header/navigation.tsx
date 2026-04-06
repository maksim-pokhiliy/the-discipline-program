"use client";

import { Stack } from "@mui/material";

import { MARKETING_NAVIGATION, type NavLink } from "@repo/shared";
import { NavLinkButton } from "@repo/ui";

type NavigationProps = {
  links?: NavLink[];
};

export const Navigation = ({ links }: NavigationProps) => {
  const finalLinks = links || MARKETING_NAVIGATION.headerLinks;

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
