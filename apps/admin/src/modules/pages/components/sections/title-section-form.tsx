"use client";

import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import { FormCard } from "@app/lib/components/form-card";

import { SectionTextField } from "../section-field";

type TitleFields = {
  title: string;
};

type TitleSectionFormProps = {
  cardTitle: string;
};

export const TitleSectionForm = ({ cardTitle }: TitleSectionFormProps): ReactElement => (
  <FormCard title={cardTitle}>
    <Stack spacing={3}>
      <SectionTextField<TitleFields> name="title" label="Section Title" />
    </Stack>
  </FormCard>
);
