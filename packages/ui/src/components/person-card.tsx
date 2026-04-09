"use client";

import type { ReactNode } from "react";

import PersonIcon from "@mui/icons-material/Person";
import { Card, CardActionArea, CardContent, CardMedia, Stack } from "@mui/material";
import Link from "next/link";

export type PersonCardProps = {
  image: string | null;
  name: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  action?: ReactNode;
};

const ImageSlot: React.FC<{ image: string | null; name: string }> = ({ image, name }) =>
  image ? (
    <CardMedia
      component="img"
      image={image}
      alt={name}
      sx={(theme) => ({ width: theme.spacing(15), objectFit: "cover" })}
    />
  ) : (
    <Stack
      sx={(theme) => ({
        width: theme.spacing(15),
        minHeight: theme.spacing(15),
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "action.hover",
      })}
    >
      <PersonIcon fontSize="large" sx={{ color: "text.disabled" }} />
    </Stack>
  );

export const PersonCard: React.FC<PersonCardProps> = ({
  image,
  name,
  href,
  onClick,
  children,
  action,
}) => {
  const content = (
    <Stack direction="row">
      <ImageSlot image={image} name={name} />
      <CardContent sx={{ flex: 1, "&:last-child": { pb: 2 } }}>{children}</CardContent>
    </Stack>
  );

  const interactive = href ?? onClick;

  return (
    <Card variant="outlined">
      <Stack direction="row">
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
