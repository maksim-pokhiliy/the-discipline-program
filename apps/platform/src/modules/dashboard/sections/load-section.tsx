"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

import type { LoadDistributionItem } from "@repo/contracts/coach-dashboard";

import { LoadBarItem } from "../components";

type LoadSectionProps = {
  items: LoadDistributionItem[];
};

export const LoadSection = ({ items }: LoadSectionProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={2}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Training Load Today
          </Typography>
          <Stack spacing={1.5}>
            {items.map((item) => (
              <LoadBarItem key={item.categoryId} item={item} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
