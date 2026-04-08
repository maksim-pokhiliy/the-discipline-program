"use client";

import { Box, type BoxProps } from "@mui/material";
import Link from "next/link";

type AthleteCardLinkProps = BoxProps & {
  href: string;
};

export const AthleteCardLink: React.FC<AthleteCardLinkProps> = ({ href, children, ...props }) => (
  <Box
    component={Link}
    href={href}
    sx={(theme) => ({
      textDecoration: "none",
      borderRadius: 1,
      transition: theme.transitions.create("opacity"),
      "&:hover": { opacity: 0.85 },
    })}
    {...props}
  >
    {children}
  </Box>
);
