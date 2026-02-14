"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { createProductSchema, type CreateProductData } from "@repo/contracts/product";
import { ContentSection } from "@repo/ui";

import { useCreateProduct } from "@app/lib/hooks/use-products";

import { ProductForm } from "../../components";

export const ProductCreateView = () => {
  const { mutate: createProduct, isPending } = useCreateProduct();

  const methods = useForm<CreateProductData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      features: [],
      isActive: true,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Create Product"
        subtitle="New product"
        backgroundColor="dark"
        backHref="/products"
        backLabel="Back to List"
        actions={[
          {
            label: "Create Product",
            onClick: handleSubmit((data) => createProduct(data)),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <ProductForm isLoading={isPending} />
      </ContentSection>
    </FormProvider>
  );
};
