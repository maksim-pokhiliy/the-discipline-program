"use client";

import { type ReactNode } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { Stack } from "@mui/material";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";

import { ContentSection } from "./layout";

type FormViewProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  isPending: boolean;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  submitLabel?: string;
  children: ReactNode;
};

export const FormView = <T extends FieldValues>({
  methods,
  onSubmit,
  isPending,
  title,
  subtitle,
  backHref,
  backLabel,
  submitLabel = "Save Changes",
  children,
}: FormViewProps<T>) => (
  <FormProvider {...methods}>
    <Stack component="form" onSubmit={methods.handleSubmit(onSubmit)} noValidate>
      <ContentSection
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        maxWidth="xl"
        textAlign="left"
        actions={[
          {
            label: submitLabel,
            type: "submit",
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        {children}
      </ContentSection>
    </Stack>
  </FormProvider>
);
