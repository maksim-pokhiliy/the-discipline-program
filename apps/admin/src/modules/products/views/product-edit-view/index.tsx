"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createProductSchema, type CreateProductData, type Product } from "@repo/contracts/product";
import { FormView } from "@repo/ui";

import { useProduct, useUpdateProduct } from "@app/lib/hooks/use-products";

import { ProductForm } from "../../components/product-form";

interface ProductEditViewProps {
  initialData: Product;
}

export const ProductEditView = ({ initialData }: ProductEditViewProps) => {
  const { data: product } = useProduct(initialData.id, initialData);
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  const activePrice = product?.prices.find((p) => p.isActive);

  const methods = useForm<CreateProductData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: product?.title || "",
      slug: product?.slug || "",
      description: product?.description || "",
      features: product?.features || [],
      isActive: product?.isActive || false,
      price: activePrice
        ? {
            amountCents: activePrice.amountCents / 100,
            currency: activePrice.currency as "USD" | "EUR" | "UAH",
            interval: activePrice.interval,
          }
        : undefined,
    },
  });

  if (!product) {
    return null;
  }

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateProduct({ id: product.id, data })}
      isPending={isPending}
      title="Edit Product"
      subtitle={product.title}
      backgroundColor="dark"
      backHref="/products"
      backLabel="Back to List"
    >
      <ProductForm isLoading={isPending} disableAutoSlug={true} />
    </FormView>
  );
};
