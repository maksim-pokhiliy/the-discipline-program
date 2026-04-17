"use client";

import { Button, type ButtonProps } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveHref } from "../hooks";

export type NavLinkButtonProps = {
  href: string;
  exact?: boolean;
} & Omit<ButtonProps, "href" | "color" | "variant">;

const navLinkSx = { borderRadius: 0, py: 2, px: 4 };

export const NavLinkButton = ({ href, exact = false, sx, ...props }: NavLinkButtonProps) => {
  const pathname = usePathname();

  const isActive = isActiveHref(href, pathname, exact);
  const color: ButtonProps["color"] = isActive ? "primary" : "secondary";

  return (
    <Button
      component={Link}
      href={href}
      variant="text"
      color={color}
      aria-current={isActive ? "page" : undefined}
      sx={[navLinkSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    />
  );
};
