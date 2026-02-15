"use client";

import { Container } from "@mui/material";

import { type AdminProductsPageData } from "@repo/contracts/product";
import { QueryWrapper } from "@repo/query";

import { useProductsPageData } from "@app/lib/hooks";

import { ProductsListSection } from "../../sections";

interface ProductsListViewProps {
  initialData: AdminProductsPageData;
}

export const ProductsListView = ({ initialData }: ProductsListViewProps) => {
  const { data, isLoading, error } = useProductsPageData({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading products..."
    >
      {(data) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <ProductsListSection products={data.products} />
        </Container>
      )}
    </QueryWrapper>
  );
};
