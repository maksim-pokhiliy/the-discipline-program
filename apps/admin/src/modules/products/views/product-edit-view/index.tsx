"use client";

import { QueryWrapper } from "@repo/ui";

import { useProduct } from "@app/lib/hooks";

import { ProductEditForm } from "./product-edit-form";

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
