"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { amountToCents } from "@repo/shared";
import { FormView } from "@repo/ui";

import { useCreateProduct } from "@app/lib/hooks";

import { ProductForm } from "../../components";
import { productFormSchema, type ProductFormData } from "../../components/product-form-schema";

const toCreateProductData = (data: ProductFormData) => ({
  ...data,
  price: data.price ? { ...data.price, amountCents: amountToCents(data.price.amount) } : undefined,
});

export const ProductCreateView = () => {
  const { mutate: createProduct, isPending } = useCreateProduct();

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      features: [],
      isFeatured: false,
      isActive: true,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createProduct(toCreateProductData(data))}
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
