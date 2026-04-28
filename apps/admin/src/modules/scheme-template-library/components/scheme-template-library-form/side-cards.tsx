"use client";

import { Stack } from "@mui/material";

import { ScopeCard } from "./scope-card";

type SideCardsProps = {
  isEdit: boolean;
  isLoading: boolean;
};

export const SideCards = ({ isEdit, isLoading }: SideCardsProps) => (
  <Stack spacing={3}>
    <ScopeCard isEdit={isEdit} isLoading={isLoading} />
  </Stack>
);
