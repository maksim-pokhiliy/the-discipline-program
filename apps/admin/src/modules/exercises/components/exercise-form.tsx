"use client";

import { Grid, Stack } from "@mui/material";

import { BasicInfoCard } from "./basic-info-card";
import { ClassificationCard } from "./classification-card";
import { DemosAndAliasesCard } from "./demos-and-aliases-card";
import { NotesCard } from "./notes-card";

type ExerciseFormProps = {
  isLoading: boolean;
};

export const ExerciseForm = ({ isLoading }: ExerciseFormProps) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={3}>
          <BasicInfoCard isLoading={isLoading} />
          <DemosAndAliasesCard isLoading={isLoading} />
          <NotesCard isLoading={isLoading} />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <ClassificationCard isLoading={isLoading} />
      </Grid>
    </Grid>
  );
};
