import { Divider, Stack, Toolbar, Typography } from "@mui/material";

import { MARKETING_NAVIGATION } from "@repo/shared";
import { Logo } from "@repo/ui";

import { SEO_CONFIG } from "@app/lib/seo";

import { FooterNavLink } from "./footer-nav-link";

type FooterProps = {
  tagline?: string;
  subcopy?: string;
};

export const Footer = ({
  tagline = SEO_CONFIG.tagline,
  subcopy = SEO_CONFIG.subcopy,
}: FooterProps) => {
  return (
    <>
      <Divider />

      <Toolbar component="footer" sx={{ height: "auto" }}>
        <Stack divider={<Divider />} sx={{ width: "100%", py: 4 }} spacing={4}>
          <Stack
            direction={{ md: "row" }}
            sx={{ justifyContent: "space-between" }}
            rowGap={2}
            columnGap={2}
          >
            <Stack
              direction={{ sm: "column", md: "row" }}
              sx={{ alignItems: "center" }}
              rowGap={2}
              columnGap={2}
            >
              <Logo />

              <Typography color="text.primary" variant="body2">
                {tagline}
              </Typography>
            </Stack>

            <Stack direction={{ md: "row" }} sx={{ alignItems: "center" }} rowGap={2} columnGap={2}>
              {MARKETING_NAVIGATION.footerLinks.map(({ text, href }) => (
                <FooterNavLink key={text} text={text} href={href} />
              ))}
            </Stack>
          </Stack>

          <Stack
            direction={{ md: "row" }}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
            rowGap={2}
            columnGap={2}
          >
            <Typography color="text.secondary" variant="caption" suppressHydrationWarning>
              © {new Date().getFullYear()} {SEO_CONFIG.siteName}. All rights reserved.
            </Typography>

            <Typography color="text.secondary" variant="caption">
              {subcopy}
            </Typography>
          </Stack>
        </Stack>
      </Toolbar>
    </>
  );
};
