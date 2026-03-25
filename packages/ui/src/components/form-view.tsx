"use client";

import { type ReactNode } from "react";

import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";

import { ContentSection } from "./layout";

interface FormViewProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  isPending: boolean;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  submitLabel?: string;
  children: ReactNode;
}

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
    <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
      <ContentSection
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        stickyToolbar
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
    </form>
  </FormProvider>
);
