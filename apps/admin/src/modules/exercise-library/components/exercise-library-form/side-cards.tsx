"use client";

import { Stack } from "@mui/material";

import { DefaultMetricsCard } from "./default-metrics-card";
import { FlagsCard } from "./flags-card";
import { MediaCard } from "./media-card";
import { ScopeCard } from "./scope-card";

type SideCardsProps = {
  isEdit: boolean;
  isLoading: boolean;
};

export const SideCards = ({ isEdit, isLoading }: SideCardsProps) => (
  <Stack spacing={3}>
    <ScopeCard isLoading={isLoading} />
    <DefaultMetricsCard isLoading={isLoading} />
    <MediaCard isLoading={isLoading} />
    <FlagsCard isEdit={isEdit} isLoading={isLoading} />
  </Stack>
);
