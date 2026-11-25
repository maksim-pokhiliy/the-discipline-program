"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { PRODUCT_PRICE_DEFAULTS } from "@repo/contracts/cms/product";
import { FormView } from "@repo/ui";

import { IMAGE_MUTATION_KEY, useCreateProduct } from "@app/lib/hooks";

import {
  ProductForm,
  productFormSchema,
  toProductApiData,
  type ProductFormData,
} from "../../components";

type ProductFormInput = z.input<typeof productFormSchema>;

export const ProductCreateView = () => {
  const { mutate: createProduct, isPending: isSaving } = useCreateProduct();
  const isImageBusy = useIsMutating({ mutationKey: IMAGE_MUTATION_KEY }) > 0;
  const isPending = isSaving || isImageBusy;

  const methods = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      features: [],
      imageUrl: null,
      isFeatured: false,
      isActive: true,
      price: { ...PRODUCT_PRICE_DEFAULTS },
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createProduct(toProductApiData(data))}
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
