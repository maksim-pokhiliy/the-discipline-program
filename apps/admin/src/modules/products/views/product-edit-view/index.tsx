"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createProductSchema, type CreateProductData, type Product } from "@repo/contracts/product";
import { QueryWrapper } from "@repo/query";
import { centsToAmount } from "@repo/shared";
import { FormView } from "@repo/ui";

import { useProduct, useUpdateProduct } from "@app/lib/hooks/use-products";

import { ProductForm } from "../../components/product-form";

type ProductEditFormProps = {
  product: Product;
};

const ProductEditForm: React.FC<ProductEditFormProps> = ({ product }) => {
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  const activePrice = product.prices.find((p) => p.isActive);

  const methods = useForm<CreateProductData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: product.title,
      slug: product.slug,
      description: product.description || "",
      features: product.features,
      isActive: product.isActive,
      price: activePrice
        ? {
            amountCents: centsToAmount(activePrice.amountCents),
            currency: activePrice.currency,
            interval: activePrice.interval,
          }
        : undefined,
    },
  });

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

type ProductEditViewProps = {
  id: string;
};

export const ProductEditView: React.FC<ProductEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useProduct(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading product..."
    >
      {(product) => <ProductEditForm product={product} />}
    </QueryWrapper>
  );
};
