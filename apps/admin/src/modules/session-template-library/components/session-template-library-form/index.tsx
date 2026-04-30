"use client";

import { Grid, Stack } from "@mui/material";

import { IdentityCard } from "./identity-card";
import { PayloadCard } from "./payload-card";
import { SideCards } from "./side-cards";

type SessionTemplateLibraryFormProps = {
  isLoading?: boolean;
};

export const SessionTemplateLibraryForm = ({
  isLoading = false,
}: SessionTemplateLibraryFormProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Stack spacing={3}>
        <IdentityCard isLoading={isLoading} />
        <PayloadCard />
      </Stack>
    </Grid>

    <Grid size={{ xs: 12, lg: 4 }}>
      <SideCards isLoading={isLoading} />
    </Grid>
  </Grid>
);
