"use client";

import Image from "next/image";
import Link from "next/link";

import { LAYOUT } from "@repo/shared";

export interface LogoProps {
  width?: number;
  height?: number;
  href?: string;
}

export const Logo = ({
  width = LAYOUT.logoSize,
  height = LAYOUT.logoSize,
  href = "/",
}: LogoProps) => {
  return (
    <Link href={href} style={{ width: "min-content", lineHeight: 0 }}>
      <Image
        alt="The Discipline Program"
        src="/icons/logo.svg"
        width={width}
        height={height}
        priority
        style={{ cursor: "pointer" }}
      />
    </Link>
  );
};
