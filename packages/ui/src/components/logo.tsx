import Image from "next/image";
import Link from "next/link";

import { LAYOUT } from "@repo/shared";

export type LogoProps = {
  width?: number;
  height?: number;
  href?: string;
  priority?: boolean;
};

export const Logo = ({
  width = LAYOUT.logoSize,
  height = LAYOUT.logoSize,
  href = "/",
  priority = false,
}: LogoProps) => {
  return (
    <Link href={href} style={{ width: "min-content", lineHeight: 0 }}>
      <Image
        alt="The Discipline Program"
        src="/icons/logo.svg"
        width={width}
        height={height}
        priority={priority}
      />
    </Link>
  );
};
