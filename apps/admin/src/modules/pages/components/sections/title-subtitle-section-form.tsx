"use client";

import { type ReactElement, type ReactNode } from "react";

import { Stack } from "@mui/material";

import { FormCard } from "@app/lib/components/form-card";

import { SectionTextField } from "../section-field";

type TitleSubtitleFields = {
  title: string;
  subtitle: string;
};

type TitleSubtitleSectionFormProps = {
  cardTitle: string;
  children?: ReactNode;
};

export const TitleSubtitleSectionForm = ({
  cardTitle,
  children,
}: TitleSubtitleSectionFormProps): ReactElement => (
  <FormCard title={cardTitle}>
    <Stack spacing={3}>
      <SectionTextField<TitleSubtitleFields> name="title" label="Section Title" />
      <SectionTextField<TitleSubtitleFields> name="subtitle" label="Section Subtitle" minRows={2} />

      {children}
    </Stack>
  </FormCard>
);
