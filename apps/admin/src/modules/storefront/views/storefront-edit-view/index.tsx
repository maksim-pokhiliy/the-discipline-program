"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import {
  createStorefrontProgramSchema,
  type CreateStorefrontProgramData,
  type StorefrontProgram,
} from "@repo/contracts/storefront";
import { ContentSection } from "@repo/ui";

import { useStorefrontProgram, useUpdateStorefrontProgram } from "@app/lib/hooks/use-storefront";

import { StorefrontProgramForm } from "../../components/storefront-program-form";

interface StorefrontEditViewProps {
  initialData: StorefrontProgram;
}

export const StorefrontEditView = ({ initialData }: StorefrontEditViewProps) => {
  const { data: product } = useStorefrontProgram(initialData.id, initialData);
  const { mutate: updateProgram, isPending } = useUpdateStorefrontProgram();

  const methods = useForm<CreateStorefrontProgramData>({
    resolver: zodResolver(createStorefrontProgramSchema),
    defaultValues: {
      title: product?.title || "",
      slug: product?.slug || "",
      description: product?.description || "",
      priceLabel: product?.priceLabel || "",
      features: product?.features || [],
      isActive: product?.isActive || false,
    },
  });

  const { handleSubmit } = methods;

  if (!product) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Edit Product"
        subtitle={product.title}
        backgroundColor="dark"
        backHref="/storefront"
        backLabel="Back to List"
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit((data) => updateProgram({ id: product.id, data })),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <StorefrontProgramForm isLoading={isPending} disableAutoSlug={true} />
      </ContentSection>
    </FormProvider>
  );
};
