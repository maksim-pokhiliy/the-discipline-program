"use client";

import { type ReactElement } from "react";

import { Grid, Stack } from "@mui/material";
import { type z } from "zod";

import { type aboutPagePersonalSchema } from "@repo/contracts/cms/pages";

import { FormCard } from "@app/lib/components/form-card";
import { useDeleteImage } from "@app/lib/hooks";

import { SectionImageField, SectionTextField } from "../section-field";

type PersonalSectionData = z.infer<typeof aboutPagePersonalSchema>;

export const PersonalSectionForm = (): ReactElement => {
  const deleteImage = useDeleteImage();

  return (
    <FormCard title="Personal Section Settings">
      <Stack spacing={3}>
        <SectionTextField<PersonalSectionData> name="title" label="Section Title" />
        <SectionTextField<PersonalSectionData>
          name="subtitle"
          label="Section Subtitle"
          minRows={2}
        />

        <SectionTextField<PersonalSectionData> name="description" label="Description" minRows={3} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SectionTextField<PersonalSectionData> name="name" label="Name" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <SectionTextField<PersonalSectionData> name="role" label="Role" />
          </Grid>
        </Grid>

        <SectionImageField name="image" onRemoveImage={deleteImage.mutate} />
      </Stack>
    </FormCard>
  );
};
