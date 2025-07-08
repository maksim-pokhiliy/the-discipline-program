"use client";

import Image from "next/image";
import Link from "next/link";

import { LOGO_SIZE } from "@app/shared/constants/layout";

export const Logo = () => {
  return (
    <Link href="/" style={{ width: "min-content", lineHeight: 0 }}>
      <Image
        alt="The Discipline Program"
        height={LOGO_SIZE}
        src={"/icons/logo.svg"}
        style={{ cursor: "pointer" }}
        width={LOGO_SIZE}
        priority
      />
    </Link>
  );
};
