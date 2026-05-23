import { Stack } from "@mui/material";

import { MARKETING_NAVIGATION } from "@app/lib/config";

import { NavLinkButton } from "./nav-link-button";

export const Navigation = () => {
  return (
    <Stack
      component="nav"
      aria-label="Marketing"
      direction={{ xs: "column", md: "row" }}
      spacing={0}
    >
      {MARKETING_NAVIGATION.headerLinks.map(({ text, href }) => (
        <NavLinkButton key={text} href={href} size="medium">
          {text}
        </NavLinkButton>
      ))}
    </Stack>
  );
};
