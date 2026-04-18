"use client";

import { type SxProps, type Theme, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const hoverSx: SxProps<Theme> = {
  "&:hover": {
    color: "text.primary",
  },
};

type FooterNavLinkProps = {
  text: string;
  href: string;
};

export const FooterNavLink = ({ text, href }: FooterNavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname !== null && pathname === href;

  return (
    <Typography
      component={Link}
      href={href}
      variant="body2"
      aria-current={isActive ? "page" : undefined}
      sx={[
        {
          textDecoration: "none",
          color: isActive ? "text.primary" : "text.secondary",
        },
        hoverSx,
      ]}
    >
      {text}
    </Typography>
  );
};
