"use client";

import { Grid, Stack } from "@mui/material";

import { IdentityCard } from "./identity-card";
import { SideCards } from "./side-cards";
import { TaxonomyCard } from "./taxonomy-card";

type ExerciseLibraryFormProps = {
  isEdit?: boolean;
  isLoading?: boolean;
};

export const ExerciseLibraryForm = ({
  isEdit = false,
  isLoading = false,
}: ExerciseLibraryFormProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 8 }}>
      <Stack spacing={3}>
        <IdentityCard isLoading={isLoading} />
        <TaxonomyCard isLoading={isLoading} />
      </Stack>
    </Grid>

    <Grid size={{ xs: 12, lg: 4 }}>
      <SideCards isEdit={isEdit} isLoading={isLoading} />
    </Grid>
  </Grid>
);
