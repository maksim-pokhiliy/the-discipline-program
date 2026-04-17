"use client";

import { type ReactNode } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { Stack } from "@mui/material";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";

import { ContentSection } from "./layout";

export type FormViewProps<TFieldValues extends FieldValues, TTransformedValues = TFieldValues> = {
  methods: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  onSubmit: (data: TTransformedValues) => void;
  isPending: boolean;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  submitLabel?: string;
  children: ReactNode;
};

export const FormView = <TFieldValues extends FieldValues, TTransformedValues = TFieldValues>({
  methods,
  onSubmit,
  isPending,
  title,
  subtitle,
  backHref,
  backLabel,
  submitLabel = "Save Changes",
  children,
}: FormViewProps<TFieldValues, TTransformedValues>) => (
  <FormProvider {...methods}>
    <Stack component="form" onSubmit={methods.handleSubmit(onSubmit)} noValidate>
      <ContentSection
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        maxWidth="xl"
        textAlign="left"
        animated={false}
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
