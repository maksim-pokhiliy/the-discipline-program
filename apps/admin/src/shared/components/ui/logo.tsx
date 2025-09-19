"use client";

import Image from "next/image";
import Link from "next/link";

import { LOGO_SIZE } from "@app/shared/constants";

interface ILogoProps {
  width?: number;
  height?: number;
}

export const Logo = ({ width = LOGO_SIZE, height = LOGO_SIZE }: ILogoProps) => {
  return (
    <Link href="/" style={{ width: "min-content", lineHeight: 0 }}>
      <Image
        alt="The Discipline Program"
        height={height}
        src={"/icons/logo.svg"}
        style={{ cursor: "pointer" }}
        width={width}
        priority
      />
    </Link>
  );
};
