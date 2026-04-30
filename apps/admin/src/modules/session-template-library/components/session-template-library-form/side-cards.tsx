"use client";

import { Stack } from "@mui/material";

import { ScopeCard } from "./scope-card";

type SideCardsProps = {
  isLoading: boolean;
};

export const SideCards = ({ isLoading }: SideCardsProps) => (
  <Stack spacing={3}>
    <ScopeCard isLoading={isLoading} />
  </Stack>
);
