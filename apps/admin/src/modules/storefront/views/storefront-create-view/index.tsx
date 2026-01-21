"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import {
  createStorefrontProgramSchema,
  type CreateStorefrontProgramData,
} from "@repo/contracts/storefront";
import { ContentSection } from "@repo/ui";

import { useCreateStorefrontProgram } from "@app/lib/hooks/use-storefront";

import { StorefrontProgramForm } from "../../components";

export const StorefrontCreateView = () => {
  const { mutate: createProgram, isPending } = useCreateStorefrontProgram();

  const methods = useForm<CreateStorefrontProgramData>({
    resolver: zodResolver(createStorefrontProgramSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      priceLabel: "",
      features: [],
      isActive: true,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Create Product"
        subtitle="New storefront item"
        backgroundColor="dark"
        backHref="/storefront"
        backLabel="Back to List"
        actions={[
          {
            label: "Create Product",
            onClick: handleSubmit((data) => createProgram(data)),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <StorefrontProgramForm isLoading={isPending} />
      </ContentSection>
    </FormProvider>
  );
};
