"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { type Product } from "@repo/contracts/cms/product";
import { centsToAmount } from "@repo/shared";
import { FormView } from "@repo/ui";

import { useUpdateProduct } from "@app/lib/hooks";

import {
  ProductForm,
  productFormSchema,
  toProductApiData,
  type ProductFormData,
} from "../../components";

type ProductFormInput = z.input<typeof productFormSchema>;

type ProductEditFormProps = {
  product: Product;
};

export const ProductEditForm: React.FC<ProductEditFormProps> = ({ product }) => {
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  const activePrice = product.prices.find((p) => p.isActive);

  const methods = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: product.title,
      slug: product.slug,
      description: product.description || "",
      features: product.features,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      price: activePrice
        ? {
            amount: centsToAmount(activePrice.amountCents),
            currency: activePrice.currency,
            interval: activePrice.interval,
          }
        : undefined,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateProduct({ id: product.id, data: toProductApiData(data) })}
      isPending={isPending}
      title="Edit Product"
      subtitle={product.title}
      backHref="/products"
      backLabel="Back to List"
    >
      <ProductForm isLoading={isPending} disableAutoSlug={true} />
    </FormView>
  );
};
