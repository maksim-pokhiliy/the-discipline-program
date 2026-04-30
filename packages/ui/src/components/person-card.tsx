"use client";

import type { ReactNode } from "react";

import { Card, CardActionArea, CardContent, Stack } from "@mui/material";
import Link from "next/link";

import { PersonCardImageSlot } from "./person-card-image-slot";

export type PersonCardProps = {
  image: string | null;
  name: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  action?: ReactNode;
};

export const PersonCard: React.FC<PersonCardProps> = ({
  image,
  name,
  href,
  onClick,
  children,
  action,
}) => {
  const content = (
    <Stack direction="row" sx={(theme) => ({ minHeight: theme.spacing(18) })}>
      <PersonCardImageSlot image={image} name={name} />
      <CardContent sx={{ flex: 1, "&:last-child": { pb: 2 } }}>{children}</CardContent>
    </Stack>
  );

  const interactive = href ?? onClick;

  return (
    <Card variant="outlined">
      <Stack direction="row" sx={{ height: "100%" }}>
        {interactive ? (
          <CardActionArea {...(href ? { component: Link, href } : { onClick })} sx={{ flex: 1 }}>
            {content}
          </CardActionArea>
        ) : (
          <Stack sx={{ flex: 1 }}>{content}</Stack>
        )}

        {action}
      </Stack>
    </Card>
  );
};
