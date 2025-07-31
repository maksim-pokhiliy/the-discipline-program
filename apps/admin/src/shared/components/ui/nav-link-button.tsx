"use client";

import { Button, ButtonProps } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkButtonProps = {
  href: string;
  exact?: boolean;
} & Omit<ButtonProps, "variant" | "color" | "href">;

export const NavLinkButton = ({ href, exact = false, ...props }: NavLinkButtonProps) => {
  const pathname = usePathname();

  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const color = isActive ? "primary" : "secondary";

  return <Button component={Link} href={href} variant="nav" color={color} {...props} />;
};
