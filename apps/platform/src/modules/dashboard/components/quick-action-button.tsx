"use client";

import { type ReactNode } from "react";

import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";

type QuickActionButtonProps = {
  icon: ReactNode;
  label: string;
  href: string;
};

export const QuickActionButton = ({ icon, label, href }: QuickActionButtonProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        transition: "border-color 0.2s",
        "&:active": { borderColor: "primary.main" },
      }}
    >
      <CardActionArea component={Link} href={href} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
            <Stack sx={{ color: "primary.main" }}>{icon}</Stack>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}
            >
              {label}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
