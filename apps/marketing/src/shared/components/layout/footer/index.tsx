"use client";

import { Divider, Stack, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_LINKS } from "@app/shared/constants";

import { Logo } from "../../ui";

export const Footer = () => {
  const pathname = usePathname();

  return (
    <>
      <Divider />

      <Toolbar component="footer">
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
                Your Discipline Dictates Your Success
              </Typography>
            </Stack>

            <Stack direction={{ md: "row" }} sx={{ alignItems: "center" }} rowGap={2} columnGap={2}>
              {NAV_LINKS.map(({ text, href }) => (
                <Typography
                  key={text}
                  component={Link}
                  href={href}
                  variant="body2"
                  sx={{
                    fontWeight: 400,
                    textDecoration: "none",
                    color: pathname === href ? "text.primary" : "text.secondary",

                    "&:hover": {
                      color: "text.primary",
                    },
                  }}
                >
                  {text}
                </Typography>
              ))}
            </Stack>
          </Stack>

          <Stack
            direction={{ md: "row" }}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
            rowGap={2}
            columnGap={2}
          >
            <Typography color="text.secondary" variant="caption">
              © {new Date().getFullYear()} The Discipline Program. All rights reserved.
            </Typography>

            <Typography color="text.secondary" variant="caption">
              Transform your fitness through discipline
            </Typography>
          </Stack>
        </Stack>
      </Toolbar>
    </>
  );
};
