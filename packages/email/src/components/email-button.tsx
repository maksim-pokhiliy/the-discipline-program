import { type ReactNode } from "react";

import { Button } from "@react-email/components";

import { theme } from "../theme";

type EmailButtonProps = {
  href: string;
  children: ReactNode;
};

export const EmailButton = ({ href, children }: EmailButtonProps) => (
  <Button href={href} style={theme.button}>
    {children}
  </Button>
);
