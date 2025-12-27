"use client";

import { Button, type ButtonProps } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkButtonProps = {
  href: string;
  exact?: boolean;
} & Omit<ButtonProps, "href" | "color" | "variant">;

export const NavLinkButton = ({ href, exact = false, ...props }: NavLinkButtonProps) => {
  const pathname = usePathname();

  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const color: ButtonProps["color"] = isActive ? "primary" : "secondary";

  return <Button component={Link} href={href} variant="text" color={color} {...props} />;
};
