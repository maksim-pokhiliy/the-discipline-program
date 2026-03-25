"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createProductSchema, type CreateProductData } from "@repo/contracts/product";
import { FormView } from "@repo/ui";

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

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createProduct(data)}
      isPending={isPending}
      title="Create Product"
      subtitle="New product"
      backHref="/products"
      backLabel="Back to List"
      submitLabel="Create Product"
    >
      <ProductForm isLoading={isPending} />
    </FormView>
  );
};
